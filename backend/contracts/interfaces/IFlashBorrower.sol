// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.5;


interface FlashBorrower {
	/// @notice Flash loan callback
	/// @param amount The amount of tokens received
	/// @param data Forwarded data from the flash loan request
	/// @dev Called after receiving the requested flash loan, should return tokens + any fees before the end of the transaction
	function onFlashLoan(
		uint256 amount,
		bytes calldata data
	) external;
}