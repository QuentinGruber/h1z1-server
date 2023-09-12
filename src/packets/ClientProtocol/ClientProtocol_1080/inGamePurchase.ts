// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2023 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { PacketStructures } from "types/packetStructure";

export const inGamePurchasePackets: PacketStructures = [
  ["InGamePurchase.PreviewOrderRequest", 0x270100, {}],
  ["InGamePurchase.PreviewOrderResponse", 0x270200, {}],
  ["InGamePurchase.PlaceOrderRequest", 0x270300, {}],
  ["InGamePurchase.PlaceOrderResponse", 0x270400, {}],
  [
    "InGamePurchase.StoreBundles",
    0x27050000,
    {
      fields: [
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        { name: "storeId", type: "uint32", defaultValue: 0 },
        { name: "unknownDword3", type: "uint32", defaultValue: 0 },
        { name: "unknownDword4", type: "uint32", defaultValue: 0 },
        {
          name: "imageData",
          type: "schema",
          fields: [
            { name: "imageSetId", type: "string", defaultValue: "" },
            { name: "imageTintValue", type: "string", defaultValue: "" }
          ]
        },
        {
          name: "storeBundles",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "bundleId", type: "uint32", defaultValue: 0 },
            {
              name: "appStoreBundle",
              type: "schema",
              fields: [
                {
                  name: "storeBundle",
                  type: "schema",
                  fields: [
                    {
                      name: "marketingBundle",
                      type: "schema",
                      fields: [
                        { name: "bundleId", type: "uint32", defaultValue: 0 },
                        { name: "nameId", type: "uint32", defaultValue: 0 },
                        {
                          name: "descriptionId",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword4",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "imageData",
                          type: "schema",
                          fields: [
                            {
                              name: "imageSetId",
                              type: "string",
                              defaultValue: ""
                            },
                            {
                              name: "imageTintValue",
                              type: "string",
                              defaultValue: ""
                            }
                          ]
                        },
                        {
                          name: "unknownBoolean1",
                          type: "boolean",
                          defaultValue: false
                        },
                        {
                          name: "unknownString1",
                          type: "string",
                          defaultValue: ""
                        },
                        {
                          name: "stationCurrencyId",
                          type: "uint32",
                          defaultValue: 0
                        },
                        { name: "price", type: "uint32", defaultValue: 0 },
                        { name: "currencyId", type: "uint32", defaultValue: 0 },
                        {
                          name: "currencyPrice",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownDword9",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownTime1",
                          type: "uint64string",
                          defaultValue: "0"
                        },
                        {
                          name: "unknownTime2",
                          type: "uint64string",
                          defaultValue: "0"
                        },
                        {
                          name: "unknownDword10",
                          type: "uint32",
                          defaultValue: 0
                        },
                        {
                          name: "unknownBoolean2",
                          type: "boolean",
                          defaultValue: false
                        },
                        {
                          name: "itemListDetails",
                          type: "array",
                          defaultValue: [{}],
                          fields: [
                            {
                              name: "unknownDword1",
                              type: "uint32",
                              defaultValue: 0
                            },
                            {
                              name: "imageSetId",
                              type: "uint32",
                              defaultValue: 0
                            },
                            { name: "itemId", type: "uint32", defaultValue: 0 },
                            {
                              name: "unknownString1",
                              type: "string",
                              defaultValue: ""
                            }
                          ]
                        }
                      ]
                    },
                    { name: "storeId", type: "uint32", defaultValue: 0 },
                    { name: "categoryId", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownBoolean1",
                      type: "boolean",
                      defaultValue: false
                    },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword9", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword10", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownBoolean2",
                      type: "boolean",
                      defaultValue: false
                    },
                    {
                      name: "unknownBoolean3",
                      type: "boolean",
                      defaultValue: false
                    },
                    {
                      name: "unknownBoolean4",
                      type: "boolean",
                      defaultValue: false
                    }
                  ]
                },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                { name: "unknownString1", type: "string", defaultValue: "" },
                { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                { name: "unknownDword9", type: "uint32", defaultValue: 0 },
                { name: "memberSalePrice", type: "uint32", defaultValue: 0 },
                { name: "unknownDword11", type: "uint32", defaultValue: 0 },
                { name: "unknownString2", type: "string", defaultValue: "" },
                { name: "unknownDword12", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: false
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  ["InGamePurchase.StoreBundleStoreUpdate", 0x27050001, {}],
  ["InGamePurchase.StoreBundleStoreBundleUpdate", 0x27050002, {}],
  ["InGamePurchase.StoreBundleCategoryGroups", 0x270600, {}],
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
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [{}],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 }
                  ]
                },
                { name: "unknownDword3", type: "uint32", defaultValue: 0 }
              ]
            }
          ]
        }
      ]
    }
  ],
  ["InGamePurchase.ExclusivePartnerStoreBundles", 0x270800, {}],
  ["InGamePurchase.StoreBundleGroups", 0x270900, {}],
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
        { name: "unknownBoolean2", type: "boolean", defaultValue: false }
      ]
    }
  ],
  ["InGamePurchase.ServerStatusRequest", 0x270c00, {}],
  ["InGamePurchase.ServerStatusResponse", 0x270d00, {}],
  ["InGamePurchase.StationCashProductsRequest", 0x270e00, {}],
  ["InGamePurchase.StationCashProductsResponse", 0x270f00, {}],
  ["InGamePurchase.CurrencyCodesRequest", 0x271000, {}],
  ["InGamePurchase.CurrencyCodesResponse", 0x271100, {}],
  ["InGamePurchase.StateCodesRequest", 0x271200, {}],
  ["InGamePurchase.StateCodesResponse", 0x271300, {}],
  ["InGamePurchase.CountryCodesRequest", 0x271400, {}],
  ["InGamePurchase.CountryCodesResponse", 0x271500, {}],
  ["InGamePurchase.SubscriptionProductsRequest", 0x271600, {}],
  ["InGamePurchase.SubscriptionProductsResponse", 0x271700, {}],
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
  ["InGamePurchase.AcccountInfoResponse", 0x271a00, {}],
  ["InGamePurchase.StoreBundleContentRequest", 0x271b00, {}],
  ["InGamePurchase.StoreBundleContentResponse", 0x271c00, {}],
  ["InGamePurchase.ClientStatistics", 0x271d00, {}],
  ["InGamePurchase.SendMannequinStoreBundlesToClient", 0x271e00, {}],
  ["InGamePurchase.DisplayMannequinStoreBundles", 0x271f00, {}],
  [
    "InGamePurchase.ItemOfTheDay",
    0x272000,
    {
      fields: [{ name: "bundleId", type: "uint32", defaultValue: 0 }]
    }
  ],
  ["InGamePurchase.EnablePaymentSources", 0x272100, {}],
  ["InGamePurchase.SetMembershipFreeItemInfo", 0x272200, {}],
  ["InGamePurchase.WishListAddBundle", 0x272300, {}],
  ["InGamePurchase.WishListRemoveBundle", 0x272400, {}],
  ["InGamePurchase.PlaceOrderRequestClientTicket", 0x272500, {}],
  ["InGamePurchase.GiftOrderNotification", 0x272600, {}],
  [
    "InGamePurchase.ActiveSchedules",
    0x272700,
    {
      fields: [
        {
          name: "unknown1",
          type: "array",
          defaultValue: [{}],
          fields: [{ name: "id", type: "uint32", defaultValue: 0 }]
        },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        {
          name: "unknown3",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "scheduleId", type: "uint32", defaultValue: 0 },
            { name: "time", type: "uint32", defaultValue: 0 },
            { name: "unknown1", type: "uint32", defaultValue: 0 },
            { name: "unknown2", type: "uint8", defaultValue: 0 },
            { name: "unknown3", type: "uint8", defaultValue: 0 },
            { name: "unknown4", type: "uint8", defaultValue: 0 },
            { name: "unknown5", type: "uint8", defaultValue: 0 }
          ]
        }
      ]
    }
  ],
  ["InGamePurchase.LoyaltyInfoAndStoreRequest", 0x272800, {}],
  ["InGamePurchase.NudgeOfferNotification", 0x272900, {}],
  ["InGamePurchase.NudgeRequestStationCashProducts", 0x272a00, {}],
  ["InGamePurchase.SpiceWebAuthUrlRequest", 0x272b00, {}],
  ["InGamePurchase.SpiceWebAuthUrlResponse", 0x272c00, {}],
  ["InGamePurchase.BundlePriceUpdate", 0x272d00, {}],
  ["InGamePurchase.WalletBalanceUpdate", 0x272e00, {}],
  ["InGamePurchase.MemberFreeItemCount", 0x272f00, {}]
];
