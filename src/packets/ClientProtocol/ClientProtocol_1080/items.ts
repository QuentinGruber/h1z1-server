// ======================================================================
//
//   GNU GENERAL PUBLIC LICENSE
//   Version 3, 29 June 2007
//   copyright (C) 2020 - 2021 Quentin Gruber
//   copyright (C) 2021 - 2022 H1emu community
//
//   https://github.com/QuentinGruber/h1z1-server
//   https://www.npmjs.com/package/h1z1-server
//
//   Based on https://github.com/psemu/soe-network
// ======================================================================

import { h1z1Buffer } from "h1z1-dataschema";


export function parseItemRequestSubData(data: h1z1Buffer, offset: number) {
  const obj: any = {},
  startOffset = offset;
  obj["unknownBoolean1"] = data.readUInt8(offset);
  offset += 1;

  if(!obj["unknownBoolean1"]) {
    obj["unknownDword1"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword2"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownDword3"] = data.readUInt32LE(offset);
    offset += 4;
    obj["count"] = data.readUInt32LE(offset);
    offset += 4;
    obj["unknownQword1"] = data.readUInt64String(offset);
    offset += 8;
    obj["unknownQword2"] = data.readUInt64String(offset);
    offset += 8;
  }

  return {
    value: obj,
    length: offset - startOffset,
  };
}

export const itemsPackets: any = [
  ["Items.LoadItemRentalDefinitionManager", 0xad01, {}],
  ["Items.SetItemTimerManager", 0xad02, {}],
  ["Items.SetItemLockTimer", 0xad03, {}],
  ["Items.SetItemTimers", 0xad04, {}],
  ["Items.SetItemTrialLockTimer", 0xad05, {}],
  ["Items.SetItemTrialTimers", 0xad06, {}],
  ["Items.AddItemTrialTimer", 0xad07, {}],
  ["Items.RemoveItemTrialTimer", 0xad08, {}],
  ["Items.ExpireItemTrialTimer", 0xad09, {}],
  ["Items.UpdateItemTrialTimer", 0xad0a, {}],
  ["Items.SetItemRentalTimers", 0xad0b, {}],
  ["Items.AddItemRentalTimer", 0xad0c, {}],
  ["Items.RemoveItemRentalTimer", 0xad0d, {}],
  ["Items.ExpireItemRentalTimer", 0xad0e, {}],
  ["Items.SetAccountItemManager", 0xad0f, {}],
  ["Items.AddAccountItem", 0xad10, {}],
  ["Items.RemoveAccountItem", 0xad11, {}],
  ["Items.UpdateAccountItem", 0xad12, {}],
  ["Items.RequestAddItemTimer", 0xad13, {}],
  ["Items.RequestTrialItem", 0xad14, {}],
  ["Items.RequestRentalItem", 0xad15, {}],
  //["Items.RequestUseItem", 0xad16, {}],
  ["Items.RequestUseAccountItem", 0xad17, {}],
  [
    "Items.RequestUseItem", 
    0xad2a, 
    {
      fields: [
        { name: "itemCount", type: "uint32", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "itemUseOption", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "" },
        { name: "characterId2", type: "uint64string", defaultValue: "" },
        { name: "characterId3", type: "uint64string", defaultValue: "" },
        { name: "itemGuid", type: "uint64string", defaultValue: "" },
        {
          name: "itemSubData",
          type: "custom",
          defaultValue: {},
          parser: parseItemRequestSubData,
        },
      ]
    }
  ],
];
