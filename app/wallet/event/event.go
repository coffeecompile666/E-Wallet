package event

type DepositSuccess struct {
	WalletID   uint
	TransferID uint
}

type WithdrawalSuccess struct {
	WalletID   uint
	TransferID uint
}

type TransferOutSuccess struct {
	WalletID       uint
	TransferID     uint
	JournalEntryID uint
}

type TransferToUserSuccess struct {
	WalletID         uint
	ReceiverWalletID uint
	TransferID       uint
}
