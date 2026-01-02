import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ComboBuilderModal from '../ComboBuilderModal';
import * as menuData from '../../data/menu';

// Mock the menu data to have stable test items
vi.mock('../../data/menu', () => ({
    PREBUILT_COMBOS: [
        { id: 1, name: "Item 1", price: 50, image: "/img1.jpg" },
        { id: 2, name: "Item 2", price: 60, image: "/img2.jpg" },
        { id: 3, name: "Item 3", price: 70, image: "/img3.jpg" },
        { id: 4, name: "Item 4", price: 80, image: "/img4.jpg" }
    ]
}));

describe('ComboBuilderModal', () => {
    const mockOnClose = vi.fn();
    const mockOnAdd = vi.fn();

    const baseProps = {
        isOpen: true,
        onClose: mockOnClose,
        onAdd: mockOnAdd,
        comboModule: {
            id: 'test-module',
            headline: "Build Your Combo",
            subtext: "Select items",
            pricingDisplay: { original: 100, current: 80 },
            config: {
                type: 'SELECT_2_FROM_SET',
                allowedItemIds: [1, 2, 3]
            }
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly when open', () => {
        render(<ComboBuilderModal {...baseProps} />);

        expect(screen.getByText("Build Your Combo")).toBeInTheDocument();
        expect(screen.getByText("Select items")).toBeInTheDocument();
        expect(screen.getByText("Item 1")).toBeInTheDocument();
        expect(screen.getByText("Item 2")).toBeInTheDocument();
        expect(screen.getByText("₹80")).toBeInTheDocument(); // Current price
    });

    it('does not render when closed', () => {
        render(<ComboBuilderModal {...baseProps} isOpen={false} />);
        expect(screen.queryByText("Build Your Combo")).not.toBeInTheDocument();
    });

    it('handles interaction for SELECT_2_FROM_SET type', () => {
        render(<ComboBuilderModal {...baseProps} />);

        const item1 = screen.getByText("Item 1");
        const item2 = screen.getByText("Item 2");
        const item3 = screen.getByText("Item 3");
        const addBtn = screen.getByText("Add to Order");

        // Initial state: Button disabled
        expect(addBtn).toBeDisabled();

        // Select 1st item
        fireEvent.click(item1);
        expect(addBtn).toBeDisabled(); // Need 2

        // Select 2nd item
        fireEvent.click(item2);
        expect(addBtn).not.toBeDisabled(); // Have 2

        // Select 3rd item (should replace one, usually the first one in simple logic or maintain limit)
        // Implementation detail: The code does `setSelectedItems(prev => [prev[1], item]);` for speed mode
        fireEvent.click(item3);

        // Should still be valid
        expect(addBtn).not.toBeDisabled();
    });

    it('calls onAdd with correct data when confirmed', () => {
        render(<ComboBuilderModal {...baseProps} />);

        fireEvent.click(screen.getByText("Item 1"));
        fireEvent.click(screen.getByText("Item 2"));

        const addBtn = screen.getByText("Add to Order");
        fireEvent.click(addBtn);

        expect(mockOnAdd).toHaveBeenCalledTimes(1);
        // We expect the first argument to be the updated comboModule with selectedItems
        const calledArg = mockOnAdd.mock.calls[0][0];
        expect(calledArg.selectedItems).toHaveLength(2);
        expect(calledArg.selectedItems[0].id).toBe(1);
        expect(calledArg.selectedItems[1].id).toBe(2);

        expect(mockOnClose).toHaveBeenCalled();
    });

    it('handles 1_PLUS_FIXED type correctly', () => {
        const props = {
            ...baseProps,
            comboModule: {
                ...baseProps.comboModule,
                config: {
                    type: '1_PLUS_FIXED',
                    fixedItemId: 4,
                    allowedItemIds: [1, 2]
                }
            }
        };

        render(<ComboBuilderModal {...props} />);

        const item1 = screen.getByText("Item 1");
        const addBtn = screen.getByText("Add to Order");

        // Select one item
        fireEvent.click(item1);

        // Should be valid immediately as we need 1 selection + the fixed one is implicit
        expect(addBtn).not.toBeDisabled();

        fireEvent.click(addBtn);

        const calledArg = mockOnAdd.mock.calls[0][0];
        // result should have 2 items: the selected one + the fixed one (id 4)
        expect(calledArg.selectedItems).toHaveLength(2);
        expect(calledArg.selectedItems).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ id: 1 }),
                expect.objectContaining({ id: 4 })
            ])
        );
    });
});
