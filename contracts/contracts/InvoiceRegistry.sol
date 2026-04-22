// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract InvoiceRegistry {
    enum Status { Pending, Paid, Cancelled }

    struct Invoice {
        address creator;
        address payer;
        address token;
        uint256 amount;
        uint256 dueDate;
        Status status;
    }

    uint256 public nextInvoiceId = 1;
    mapping(uint256 => Invoice) public invoices;

    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed creator,
        address indexed payer,
        address token,
        uint256 amount,
        uint256 dueDate
    );
    event InvoicePaid(uint256 indexed invoiceId, address indexed payer, uint256 amount);
    event InvoiceCancelled(uint256 indexed invoiceId, address indexed creator);

    function createInvoice(
        address payer,
        address token,
        uint256 amount,
        uint256 dueDate
    ) external returns (uint256 invoiceId) {
        require(amount > 0, "Amount must be > 0");
        require(payer != address(0), "Invalid payer");

        invoiceId = nextInvoiceId++;
        invoices[invoiceId] = Invoice({
            creator: msg.sender,
            payer: payer,
            token: token,
            amount: amount,
            dueDate: dueDate,
            status: Status.Pending
        });

        emit InvoiceCreated(invoiceId, msg.sender, payer, token, amount, dueDate);
    }

    function pay(uint256 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.payer == msg.sender, "Not the payer");
        require(inv.status == Status.Pending, "Invoice not payable");

        inv.status = Status.Paid;
        IERC20(inv.token).transferFrom(msg.sender, inv.creator, inv.amount);

        emit InvoicePaid(invoiceId, msg.sender, inv.amount);
    }

    function cancel(uint256 invoiceId) external {
        Invoice storage inv = invoices[invoiceId];
        require(inv.creator == msg.sender, "Not the creator");
        require(inv.status == Status.Pending, "Cannot cancel");

        inv.status = Status.Cancelled;

        emit InvoiceCancelled(invoiceId, msg.sender);
    }

    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        return invoices[invoiceId];
    }
}
