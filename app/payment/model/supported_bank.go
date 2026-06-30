package model

type Bank struct {
	Code string
	Name string
	Icon string
}

type SupportedBanks string

const (
	VCB  SupportedBanks = "VCB"
	TCB  SupportedBanks = "TCB"
	BIDV SupportedBanks = "BIDV"
	ACB  SupportedBanks = "ACB"
	MB   SupportedBanks = "MB"
	TPB  SupportedBanks = "TPB"
	VPB  SupportedBanks = "VPB"
	SCB  SupportedBanks = "SCB"
)

var FakeBanks = []Bank{
	{
		Code: "VCB",
		Name: "Vietcombank",
		Icon: "https://dummyimage.com/64x64/16a34a/ffffff&text=VCB",
	},
	{
		Code: "TCB",
		Name: "Techcombank",
		Icon: "https://dummyimage.com/64x64/dc2626/ffffff&text=TCB",
	},
	{
		Code: "BIDV",
		Name: "BIDV",
		Icon: "https://dummyimage.com/64x64/1d4ed8/ffffff&text=BIDV",
	},
	{
		Code: "ACB",
		Name: "ACB",
		Icon: "https://dummyimage.com/64x64/2563eb/ffffff&text=ACB",
	},
	{
		Code: "MB",
		Name: "MB Bank",
		Icon: "https://dummyimage.com/64x64/15803d/ffffff&text=MB",
	},
	{
		Code: "TPB",
		Name: "TPBank",
		Icon: "https://dummyimage.com/64x64/7c3aed/ffffff&text=TPB",
	},
	{
		Code: "VPB",
		Name: "VPBank",
		Icon: "https://dummyimage.com/64x64/166534/ffffff&text=VPB",
	},
	{
		Code: "SCB",
		Name: "SCB",
		Icon: "https://dummyimage.com/64x64/0f766e/ffffff&text=SCB",
	},
}
