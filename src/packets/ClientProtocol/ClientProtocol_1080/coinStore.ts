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

export const coinStorePackets: PacketStructures = [
  [
    "CoinStore.ItemList",
    0x6e0100,
    {
      fields: [
        {
          name: "items",
          type: "array",
          defaultValue: [{}],
          fields: [
            { name: "itemId", type: "uint32", defaultValue: 0 },
            {
              name: "itemData",
              type: "schema",
              fields: [
                { name: "itemId2", type: "uint32", defaultValue: 0 },
                { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownBoolean1",
                  type: "boolean",
                  defaultValue: false
                },
                {
                  name: "unknownBoolean2",
                  type: "boolean",
                  defaultValue: false
                }
              ]
            }
          ]
        },
        { name: "unknown1", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["CoinStore.ItemDefinitionsRequest", 0x6e0200, {}],
  ["CoinStore.ItemDefinitionsResponse", 0x6e0300, {}],
  [
    "CoinStore.SellToClientRequest",
    0x6e0400,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        { name: "itemId", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
        { name: "quantity", type: "uint32", defaultValue: 0 },
        { name: "unknown6", type: "uint32", defaultValue: 0 }
      ]
    }
  ],
  ["CoinStore.BuyFromClientRequest", 0x6e0500, {}],
  [
    "CoinStore.TransactionComplete",
    0x6e0600,
    {
      fields: [
        { name: "unknown1", type: "uint32", defaultValue: 0 },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
        { name: "unknown5", type: "uint32", defaultValue: 0 },
        { name: "unknown6", type: "uint32", defaultValue: 0 },
        { name: "unknown7", type: "uint32", defaultValue: 0 },
        { name: "unknown8", type: "uint32", defaultValue: 0 },
        { name: "timestamp", type: "uint32", defaultValue: 0 },
        { name: "unknown9", type: "uint32", defaultValue: 0 },
        { name: "itemId", type: "uint32", defaultValue: 0 },
        { name: "unknown10", type: "uint32", defaultValue: 0 },
        { name: "quantity", type: "uint32", defaultValue: 0 },
        { name: "unknown11", type: "uint32", defaultValue: 0 },
        { name: "unknown12", type: "uint8", defaultValue: 0 }
      ]
    }
  ],
  ["CoinStore.Open", 0x6e0700, {}],
  ["CoinStore.ItemDynamicListUpdateRequest", 0x6e0800, {}],
  ["CoinStore.ItemDynamicListUpdateResponse", 0x6e0900, {}],
  ["CoinStore.MerchantList", 0x6e0a00, {}],
  ["CoinStore.ClearTransactionHistory", 0x6e0b00, {}],
  ["CoinStore.BuyBackRequest", 0x6e0c00, {}],
  ["CoinStore.BuyBackResponse", 0x6e0d00, {}],
  ["CoinStore.SellToClientAndGiftRequest", 0x6e0e00, {}],
  ["CoinStore.ReceiveGiftItem", 0x6e1100, {}],
  ["CoinStore.GiftTransactionComplete", 0x6e1200, {}]
];
