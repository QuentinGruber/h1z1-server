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

import { h1z1Buffer } from "h1z1-dataschema";
import { PacketStructures } from "types/packetStructure";

export function parseItemRequestSubData(data: h1z1Buffer, offset: number) {
  const obj: any = {},
    startOffset = offset;
  obj["unknownBoolean1"] = data.readUInt8(offset);
  offset += 1;

  if (!obj["unknownBoolean1"]) {
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
    length: offset - startOffset
  };
}
export const itemsPackets: PacketStructures = [
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
  ["Items.UseClientItem", 0xad0f, {}],
  ["Items.SetAccountItemManager", 0xad10, {}],
  ["Items.AddAccountItem", 0xad11, {}],
  ["Items.RemoveAccountItem", 0xad12, {}],
  ["Items.UpdateAccountItem", 0xad13, {}],
  ["Items.SetEscrowAccountItemManager", 0xad14, {}],
  ["Items.AddEscrowAccountItem", 0xad15, {}],
  ["Items.RemoveEscrowAccountItem", 0xad16, {}],
  ["Items.UpdateEscrowAccountItem", 0xad17, {}],
  ["Items.AccountItemManagerStateChanged", 0xad18, {}],
  ["Items.AddNewAccountItemRec", 0xad19, {}],
  ["Items.RemoveNewAccountItemRec", 0xad1a, {}],
  ["Items.RemoveNewAccountItemRecByItemId", 0xad1b, {}],
  ["Items.RemoveAllNewAccountItemRecs", 0xad1c, {}],
  ["Items.ReportNewRewardCrateAdded", 0xad1d, {}],
  ["Items.ReportRewardCrateContents", 0xad1e, {}],
  ["Items.ItemPacketIdSetEmoteItem", 0xad1f, {}],
  ["Items.RemoveEmoteItem", 0xad20, {}],
  ["Items.SetSkinItemManager", 0xad21, {}],
  ["Items.SetSkinItem", 0xad22, {}],
  ["Items.RemoveSkinItem", 0xad23, {}],
  ["Items.SetSkinItemCollectionCustomName", 0xad24, {}],
  ["Items.SelectSkinItemCollectionId", 0xad25, {}],
  ["Items.SetCurrentSkinItemCollection", 0xad26, {}],
  ["Items.RequestAddItemTimer", 0xad27, {}],
  ["Items.RequestTrialItem", 0xad28, {}],
  ["Items.RequestRentalItem", 0xad29, {}],
  [
    "Items.RequestUseItem",
    0xad2a,
    {
      fields: [
        { name: "itemCount", type: "uint32", defaultValue: 0 },
        { name: "unknownDword1", type: "uint32", defaultValue: 0 },
        { name: "itemUseOption", type: "uint32", defaultValue: 0 },
        { name: "characterId", type: "uint64string", defaultValue: "" },
        { name: "targetCharacterId", type: "uint64string", defaultValue: "" },
        { name: "sourceCharacterId", type: "uint64string", defaultValue: "" },
        { name: "itemGuid", type: "uint64string", defaultValue: "" },
        {
          name: "itemSubData",
          type: "custom",
          defaultValue: {},
          parser: parseItemRequestSubData
        }
      ]
    }
  ],
  ["Items.RequestUseAccountItem", 0xad2b, {}],
  ["Items.RequestRemoveNewAccountItemRec", 0xad2c, {}],
  ["Items.RemoveNewAccountItemRecByItemId", 0xad2d, {}],
  ["Items.RequestRemoveAllNewAccountItemRecs", 0xad2e, {}],
  ["Items.RequestSetEmoteItem", 0xad2f, {}],
  ["Items.RequestSetSkinItem", 0xad30, {}],
  ["Items.SetSkinItemByItemId", 0xad31, {}],
  ["Items.RequestSetSkinItemFlags", 0xad32, {}],
  ["Items.RequestUnsetSkinItem", 0xad33, {}],
  ["Items.RequestRemoveSkinItem", 0xad34, {}],
  ["Items.SetSkinItemCollectionCustomName", 0xad35, {}],
  ["Items.RequestSelectSkinItemCollection", 0xad36, {}],
  ["Items.RequestOpenAccountCrate", 0xad37, {}],
  ["Items.RequestPreviewAccountCrateRewards", 0xad38, {}]
];
