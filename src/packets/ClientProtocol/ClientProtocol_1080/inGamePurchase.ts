// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2025 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { PacketStructures } from "types/packetStructure";
import { storeBundleSchema } from "./shared";

export const inGamePurchasePackets: PacketStructures = [
  ["InGamePurchase.PreviewOrderRequest", 0x270100, {}],
  [
    "InGamePurchase.PreviewOrderResponse",
    0x270200,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["InGamePurchase.PlaceOrderRequest", 0x270300, {}],
  [
    "InGamePurchase.PlaceOrderResponse",
    0x270400,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        {
          name: "unknownString1",
          type: "string",
          defaultValue: ""
        },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  [
    "InGamePurchase.StoreBundles",
    0x270500,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        { name: "unknownDword2", type: "uint32", defaultValue: 1 },
        { name: "storeId", type: "uint32", defaultValue: 1 },
        { name: "unknownDword3", type: "uint32", defaultValue: 71 },
        { name: "unknownDword4", type: "uint32", defaultValue: 71 },
        {
          name: "imageData",
          type: "schema",
          fields: [
            { name: "imageSetId", type: "string", defaultValue: "0" },
            { name: "imageTintValue", type: "string", defaultValue: "0" }
          ]
        },
        {
          name: "storeBundles",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "bundleId", type: "uint32", defaultValue: 0 },
            ...storeBundleSchema
          ]
        }
      ]
    }
  ],
  ["InGamePurchase.StoreBundleStoreUpdate", 0x27050001, {}],
  ["InGamePurchase.StoreBundleStoreBundleUpdate", 0x27050002, {}],
  [
    "InGamePurchase.StoreBundleCategoryGroups",
    0x270600,
    {
      fields: [
        {
          name: "categoryGroups",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "Id", type: "uint32", defaultValue: 0 },
            {
              name: "categoryData",
              type: "schema",
              fields: [
                { name: "Id", type: "uint32", defaultValue: 0 },
                {
                  name: "categoryGroups",
                  type: "array",
                  defaultValue: [{}],
                  fields: [{ name: "Id", type: "uint32", defaultValue: 0 }]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  [
    "InGamePurchase.StoreBundleCategories",
    0x270700,
    {
      fields: [
        {
          name: "categories",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "categoryId", type: "uint32", defaultValue: 0 },
            {
              name: "categoryData",
              type: "schema",
              fields: [
                { name: "categoryId", type: "uint32", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
                { name: "unknownString2", type: "string", defaultValue: "" },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: false
                },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 }
              ]
            }
          ]
        },
        {
          name: "unknownBoolean1",
          type: "boolean",
          defaultValue: false
        }
      ]
    }
  ],
  [
    "InGamePurchase.ExclusivePartnerStoreBundles",
    0x270800,
    {
      fields: [
        {
          name: "storeBundles",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "bundleId", type: "uint32", defaultValue: 0 },
            ...storeBundleSchema
          ]
        }
      ]
    }
  ],
  [
    "InGamePurchase.StoreBundleGroups",
    0x270900,
    {
      fields: [
        {
          name: "bundleGroups",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "Id", type: "uint32", defaultValue: 0 },
            {
              name: "categoryData",
              type: "schema",
              fields: [
                { name: "Id", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
                { name: "unknownString2", type: "string", defaultValue: "" },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: false
                },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  ["InGamePurchase.WalletInfoRequest", 0x270a00, {}],
  [
    "InGamePurchase.WalletInfoResponse",
    0x270b00,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "" },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownString2", type: "string", defaultValue: "" },
            { name: "unknownString3", type: "string", defaultValue: "" },
            { name: "unknownBoolean2", type: "boolean", defaultValue: false }
          ]
        }
      ]
    }
  ],
  ["InGamePurchase.ServerStatusRequest", 0x270c00, {}],
  ["InGamePurchase.ServerStatusResponse", 0x270d01, {}],
  ["InGamePurchase.StationCashProductsRequest", 0x270e00, {}],
  [
    "InGamePurchase.StationCashProductsResponse",
    0x270f00,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        {
          name: "products",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "unknownString2", type: "string", defaultValue: "" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownString3", type: "string", defaultValue: "" },
            { name: "unknownString4", type: "string", defaultValue: "" },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  ["InGamePurchase.CurrencyCodesRequest", 0x271000, {}],
  ["InGamePurchase.CurrencyCodesResponse", 0x271100, {}],
  ["InGamePurchase.StateCodesRequest", 0x271200, {}],
  [
    "InGamePurchase.StateCodesResponse",
    0x271300,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        {
          name: "stateCodes",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "stateCode", type: "string", defaultValue: "" },
            { name: "stateName", type: "string", defaultValue: "" }
          ]
        }
      ]
    }
  ],
  ["InGamePurchase.CountryCodesRequest", 0x271400, {}],
  [
    "InGamePurchase.CountryCodesResponse",
    0x271500,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        {
          name: "countryCodes",
          type: "array",
          defaultValue: [],
          fields: [
            { name: "countryCode", type: "string", defaultValue: "" },
            { name: "languageLocale", type: "string", defaultValue: "" },
            { name: "countryLocale", type: "string", defaultValue: "" },
            { name: "countryName", type: "string", defaultValue: "" }
          ]
        }
      ]
    }
  ],
  ["InGamePurchase.SubscriptionProductsRequest", 0x271600, {}],
  [
    "InGamePurchase.SubscriptionProductsResponse",
    0x271700,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        {
          name: "products",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownString1", type: "string", defaultValue: "" },
            { name: "unknownString2", type: "string", defaultValue: "" },
            { name: "unknownString3", type: "string", defaultValue: "" },
            { name: "unknownString4", type: "string", defaultValue: "" },
            { name: "unknownString5", type: "string", defaultValue: "" },
            { name: "unknownString6", type: "string", defaultValue: "" },
            { name: "unknownString7", type: "string", defaultValue: "" },
            { name: "unknownString8", type: "string", defaultValue: "" },
            { name: "unknownString9", type: "string", defaultValue: "" },
            { name: "unknownString10", type: "string", defaultValue: "" },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false }
          ]
        }
      ]
    }
  ],
  [
    "InGamePurchase.EnableMarketplace",
    0x271800,
    {
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "InGamePurchase.AcccountInfoRequest",
    0x271900,
    {
      fields: [{ name: "locale", type: "string", defaultValue: "" }]
    }
  ],
  [
    "InGamePurchase.AcccountInfoResponse",
    0x271a00,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "locale", type: "string", defaultValue: "" },
        { name: "currency", type: "string", defaultValue: "" },
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "InGamePurchase.StoreBundleContentRequest",
    0x271b00,
    {
      fields: [
        {
          name: "bundles",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "bundleId", type: "uint32", defaultValue: 0 },
            {
              name: "items",
              type: "array",
              defaultValue: [{}],
              fields: [{ name: "itemDefId", type: "uint32", defaultValue: 0 }]
            }
          ]
        }
      ]
    }
  ],
  [
    "InGamePurchase.StoreBundleContentResponse",
    0x271c00,
    {
      fields: [
        {
          name: "bundles",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "itemDefId", type: "uint32", defaultValue: 0 },
            { name: "bundleId", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  [
    "InGamePurchase.ClientStatistics",
    0x271d00,
    {
      fields: [
        { name: "unknownByte1", type: "uint8", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        { name: "unknownDword5", type: "uint32", defaultValue: 0 },
        { name: "unknownDword6", type: "uint32", defaultValue: 0 },
        { name: "unknownDword7", type: "uint32", defaultValue: 0 },
        { name: "unknownDword8", type: "uint32", defaultValue: 0 },
        { name: "unknownDword9", type: "uint32", defaultValue: 0 },
        { name: "unknownDword10", type: "uint32", defaultValue: 0 },
        { name: "unknownDword11", type: "uint32", defaultValue: 0 },
        { name: "unknownDword12", type: "uint32", defaultValue: 0 },
        { name: "unknownDword13", type: "uint32", defaultValue: 0 },
        { name: "unknownDword14", type: "uint32", defaultValue: 0 },
        { name: "unknownDword15", type: "uint32", defaultValue: 0 },
        { name: "unknownDword16", type: "uint32", defaultValue: 0 },
        { name: "unknownDword17", type: "uint32", defaultValue: 0 },
        { name: "unknownDword18", type: "uint32", defaultValue: 0 },
        { name: "unknownDword19", type: "uint32", defaultValue: 0 },
        { name: "unknownDword20", type: "uint32", defaultValue: 0 },
        { name: "unknownDword21", type: "uint32", defaultValue: 0 },
        { name: "unknownDword22", type: "uint32", defaultValue: 0 },
        { name: "unknownDword23", type: "uint32", defaultValue: 0 },
        { name: "unknownDword24", type: "uint32", defaultValue: 0 },
        { name: "unknownDword25", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["InGamePurchase.SendMannequinStoreBundlesToClient", 0x271e00, {}],
  [
    "InGamePurchase.DisplayMannequinStoreBundles",
    0x271f00,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [{}],
          fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
        }
      ]
    }
  ],
  [
    "InGamePurchase.ItemOfTheDay",
    0x272000,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        { name: "unknownDword5", type: "uint32", defaultValue: 0 },
        { name: "unknownDword6", type: "uint32", defaultValue: 0 },
        { name: "unknownDword7", type: "uint32", defaultValue: 0 },
        { name: "unknownDword8", type: "uint32", defaultValue: 0 },
        { name: "unknownDword9", type: "uint32", defaultValue: 0 },
        { name: "unknownDword10", type: "uint32", defaultValue: 0 },
        { name: "unknownDword11", type: "uint32", defaultValue: 0 },
        { name: "unknownDword12", type: "uint32", defaultValue: 0 },
        ...storeBundleSchema,
        { name: "unknownBoolean1", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "InGamePurchase.EnablePaymentSources",
    0x272100,
    {
      fields: [
        { name: "unknownBoolean1", type: "boolean", defaultValue: false },
        { name: "unknownBoolean2", type: "boolean", defaultValue: false }
      ]
    }
  ],
  [
    "InGamePurchase.SetMembershipFreeItemInfo",
    0x272200,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["InGamePurchase.WishListAddBundle", 0x272300, {}],
  ["InGamePurchase.WishListRemoveBundle", 0x272400, {}],
  ["InGamePurchase.PlaceOrderRequestClientTicket", 0x272500, {}],
  [
    "InGamePurchase.GiftOrderNotification",
    0x272600,
    {
      fields: [
        { name: "unknownQword1", type: "uint64string", defaultValue: "" },
        { name: "unknownString1", type: "string", defaultValue: "" },
        { name: "unknownString2", type: "string", defaultValue: "" },
        { name: "unknownString3", type: "string", defaultValue: "" },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 }
        // TODO: There could be more, I just couldn't make sense of it yet.
      ]
    }
  ],
  [
    "InGamePurchase.ActiveSchedules",
    0x272700,
    {
      fields: [
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [{}],
          fields: [{ name: "id", type: "uint32", defaultValue: 0 }]
        },
        { name: "unknownString1", type: "string", defaultValue: "" },
        {
          name: "unknownArray3",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "scheduleId", type: "uint32", defaultValue: 0 },
            { name: "time", type: "uint32", defaultValue: 0 },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  ["InGamePurchase.LoyaltyInfoAndStoreRequest", 0x272800, {}],
  [
    "InGamePurchase.NudgeOfferNotification",
    0x272900,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 1 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        { name: "unknownDword5", type: "uint32", defaultValue: 0 },
        { name: "unknownDword6", type: "uint32", defaultValue: 0 },
        { name: "unknownDword7", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["InGamePurchase.NudgeRequestStationCashProducts", 0x272a00, {}],
  ["InGamePurchase.SpiceWebAuthUrlRequest", 0x272b00, {}],
  [
    "InGamePurchase.SpiceWebAuthUrlResponse",
    0x272c00,
    {
      fields: [
        { name: "codeStringMappingId", type: "string", defaultValue: "0" },
        { name: "url", type: "string", defaultValue: "" }
      ]
    }
  ],
  [
    "InGamePurchase.BundlePriceUpdate",
    0x272d00,
    {
      fields: [
        {
          name: "unknownArray1",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "unknownBoolean1", type: "boolean", defaultValue: false },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "unknownDword3", type: "uint32", defaultValue: 0 },
            { name: "unknownDword4", type: "uint32", defaultValue: 0 },
            { name: "unknownDword5", type: "uint32", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  [
    "InGamePurchase.WalletBalanceUpdate",
    0x272e00,
    {
      fields: [{ name: "totalCoinsCount", type: "uint32", defaultValue: 0 }]
    }
  ],
  [
    "InGamePurchase.MemberFreeItemCount",
    0x272f00,
    {
      fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }]
    }
  ]
];
