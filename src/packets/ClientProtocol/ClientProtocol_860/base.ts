import { packPositionUpdateData, packUnsignedIntWith2bitLengthValue, readPositionUpdateData, readUnsignedIntWith2bitLengthValue } from "./shared/shared";
import { achievementDataSchema, currencySchema, EquippedContainersSchema, identitySchema, profileDataSchema, resourceEventDataSubSchema, rewardBundleDataSchema, skyData, statDataSchema } from "./shared/shared";
import { packWeaponPacket, parseWeaponPacket } from "./weapon";


export const basePackets:any = [
    ["Server", 0x01, {}],
    ["ClientFinishedLoading", 0x02, {}],
    [
      "SendSelfToClient",
      0x03,
      {
        fields: [
          {
            name: "data",
            type: "byteswithlength",
            fields: [
              { name: "guid", type: "uint64string", defaultValue: 0 },
              { name: "characterId", type: "uint64string", defaultValue: 0 },
              {
                name: "unknownUint1",
                type: "custom",
                parser: readUnsignedIntWith2bitLengthValue,
                packer: packUnsignedIntWith2bitLengthValue,
              },
              { name: "lastLoginDate", type: "uint64string", defaultValue: 0 },
              { name: "actorModelId", type: "uint32", defaultValue: 0 },
              { name: "extraModel", type: "string", defaultValue: "" },
              { name: "unknownString1", type: "string", defaultValue: "" },
              { name: "unknownDword4", type: "uint32", defaultValue: 0 },
              { name: "unknownDword5", type: "uint32", defaultValue: 0 },
              { name: "extraModelTexture", type: "string", defaultValue: "" },
              { name: "unknownString3", type: "string", defaultValue: "" },
              { name: "unknownString4", type: "string", defaultValue: "" },
              { name: "headId", type: "uint32", defaultValue: 0 },
              { name: "unknownDword6", type: "uint32", defaultValue: 0 },
              { name: "factionId", type: "uint32", defaultValue: 0 },
              { name: "unknownDword9", type: "uint32", defaultValue: 0 },
              { name: "unknownDword10", type: "uint32", defaultValue: 0 },
              { name: "position", type: "floatvector4", defaultValue: 0 },
              { name: "rotation", type: "floatvector4", defaultValue: 0 },
              identitySchema,
              { name: "unknownDword14", type: "uint32", defaultValue: 0 },
              currencySchema,
              { name: "creationDate", type: "uint64string", defaultValue: 0 },
              { name: "unknownDword15", type: "uint32", defaultValue: 0 },
              { name: "unknownDword16", type: "uint32", defaultValue: 0 },
              { name: "unknownBoolean1", type: "boolean", defaultValue: true },
              { name: "unknownBoolean2", type: "boolean", defaultValue: true },
              { name: "isMember", type: "uint32", defaultValue: 0 },
              { name: "unknownDword18", type: "uint32", defaultValue: 0 },
              { name: "unknownBoolean3", type: "boolean", defaultValue: true },
              { name: "unknownDword19", type: "uint32", defaultValue: 0 },
              { name: "unknownDword20", type: "uint32", defaultValue: 0 },
              { name: "unknownDword21", type: "uint32", defaultValue: 0 },
              { name: "unknownDword22", type: "uint32", defaultValue: 0 },
              { name: "unknownDword23", type: "uint32", defaultValue: 0 },
              { name: "unknownBoolean4", type: "boolean", defaultValue: true },
              { name: "unknownTime1", type: "uint64string", defaultValue: 0 },
              { name: "unknownTime2", type: "uint64string", defaultValue: 0 },
              { name: "unknownDword24", type: "uint32", defaultValue: 0 },
              { name: "unknownBoolean5", type: "boolean", defaultValue: true },
              { name: "dailyRibbonCount", type: "uint32", defaultValue: 0 },
              {
                name: "profiles",
                type: "array",
                defaultValue: [],
                fields: profileDataSchema,
              },
              { name: "currentProfile", type: "uint32", defaultValue: 0 },
              {
                name: "unknownArray2",
                type: "array",
                defaultValue: [],
                fields: [
                  {
                    name: "unknownDword1",
                    type: "int32",
                    defaultValue: 0,
                  },
                  {
                    name: "unknownDword2",
                    type: "int32",
                    defaultValue: 0,
                  },
                ],
              },
              {
                name: "collections",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword7", type: "uint32", defaultValue: 0 },
  
                  {
                    name: "unknownData1",
                    type: "schema",
                    fields: rewardBundleDataSchema,
                  },
  
                  {
                    name: "unknownArray2",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword2",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword3",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword4",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword5",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword6",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword7",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownBoolean1",
                            type: "boolean",
                            defaultValue: true,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                name: "inventory",
                type: "schema",
                fields: [
                  {
                    name: "items",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownQword1",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                      /* {
                        name: "unknownBoolean",
                        type: "boolean",
                        defaultValue: 0,
                      },*/
                      { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                      // weird stuff
                      {
                        name: "unknownQword2",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                      { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword9", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword10", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownBoolean2",
                        type: "boolean",
                        defaultValue: 0,
                      },
                      {
                        name: "unknownQword3",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                    ],
                  },
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                ],
              },
              { name: "gender", type: "uint32", defaultValue: 0 },
              {
                name: "characterQuests",
                type: "schema",
                fields: [
                  {
                    name: "quests",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownBoolean1",
                        type: "boolean",
                        defaultValue: true,
                      },
                      {
                        name: "unknownGuid1",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                      { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownBoolean2",
                        type: "boolean",
                        defaultValue: true,
                      },
                      { name: "unknownFloat1", type: "float", defaultValue: 0 },
  
                      {
                        name: "reward",
                        type: "schema",
                        fields: rewardBundleDataSchema,
                      },
  
                      {
                        name: "unknownArray2",
                        type: "array",
                        defaultValue: [],
                        fields: [
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword2",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword3",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownBoolean1",
                            type: "boolean",
                            defaultValue: true,
                          },
  
                          {
                            name: "reward",
                            type: "schema",
                            fields: rewardBundleDataSchema,
                          },
  
                          {
                            name: "unknownDword14",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword15",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword16",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword17",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownBoolean4",
                            type: "boolean",
                            defaultValue: true,
                          },
  
                          {
                            name: "unknownDword18",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword19",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword20",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword21",
                            type: "uint32",
                            defaultValue: 0,
                          },
                        ],
                      },
                      { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownBoolean3",
                        type: "boolean",
                        defaultValue: true,
                      },
                      {
                        name: "unknownBoolean4",
                        type: "boolean",
                        defaultValue: true,
                      },
                    ],
                  },
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  {
                    name: "unknownBoolean1",
                    type: "boolean",
                    defaultValue: true,
                  },
                  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "characterAchievements",
                type: "array",
                defaultValue: [],
                fields: achievementDataSchema,
              },
              {
                name: "acquaintances",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "guid", type: "uint64string", defaultValue: 0 },
                  { name: "name", type: "string", defaultValue: "" },
                  { name: "type", type: "uint32", defaultValue: 0 },
                  { name: "elapsedTime", type: "uint64string", defaultValue: 0 },
                  {
                    name: "online",
                    type: "boolean",
                    defaultValue: true,
                  },
                ],
              },
              {
                name: "recipes",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "recipeId", type: "uint32", defaultValue: 0 },
                  { name: "Name", type: "uint32", defaultValue: 0 },
                  { name: "iconId", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                  { name: "description", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                  {
                    name: "memberOnly",
                    type: "boolean",
                    defaultValue: false,
                  },
                  { name: "filterType", type: "uint32", defaultValue: 0 },
                  {
                    name: "components",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      { name: "name", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                      {
                        name: "numberOfItems",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                      { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword8", type: "uint32", defaultValue: 10 },
                    ],
                  },
                  { name: "itemDefinitionId", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "mounts",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                  {
                    name: "unknownQword1",
                    type: "uint64string",
                    defaultValue: 0,
                  },
                  {
                    name: "unknownBoolean1",
                    type: "boolean",
                    defaultValue: true,
                  },
                  { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                  { name: "unknownString1", type: "string", defaultValue: "" },
                ],
              },
              {
                name: "unknownCoinStoreData",
                type: "schema",
                fields: [
                  {
                    name: "unknownBoolean1",
                    type: "boolean",
                    defaultValue: true,
                  },
                  {
                    name: "unknownArray1",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    ],
                  },
                ],
              },
              {
                name: "unknownArray10",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "unknownEffectArray",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  {
                    name: "unknownData1",
                    type: "schema",
                    fields: [
                      {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword2",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword3",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword4",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword5",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword6",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword7",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword8",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword9",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownFloat1",
                            type: "float",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword10",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownQword1",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownQword2",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownQword3",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownGuid1",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword11",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword12",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword13",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword14",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword15",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword16",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword17",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownGuid2",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword18",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword19",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownByte1",
                            type: "uint8",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword20",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownGuid3",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownGuid4",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword21",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownQword4",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword22",
                            type: "uint32",
                            defaultValue: 0,
                          },
                        ],
                      },
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownBoolean1",
                        type: "boolean",
                        defaultValue: true,
                      },
                      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownArray1",
                        type: "array",
                        defaultValue: [],
                        fields: [
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                name: "stats",
                type: "array",
                defaultValue: [],
                fields: statDataSchema,
              },
              {
                name: "playerTitles",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "titleId", type: "uint32", defaultValue: 0 },
                  { name: "titleType", type: "uint32", defaultValue: 0 },
                  { name: "stringId", type: "uint32", defaultValue: 0 },
                ],
              },
              { name: "currentPlayerTitle", type: "uint32", defaultValue: 0 },
              {
                name: "unknownArray13",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "unknownArray14",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                ],
              },
              { name: "unknownDword33", type: "uint32", defaultValue: 0 },
              {
                name: "unknownArray15", // need to check if it can be empty
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "unknownArray16", // dup of unknownArray15
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "unknownArray17", // need to check if it can be empty
                type: "array",
                defaultValue: [],
                fields: [
                  {
                    name: "unknownBoolean1",
                    type: "boolean",
                    defaultValue: true,
                  },
                ],
              },
  
              { name: "unknownDword34", type: "uint32", defaultValue: 0 },
              { name: "unknownDword35", type: "uint32", defaultValue: 0 },
              {
                name: "abilities",
                type: "schema",
                fields: [
                  {
                    name: "unknownArray1",
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                  {
                    name: "unknownArray2", // same as unknownArray1
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                  {
                    name: "unknownArray3", // same as unknownArray1
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                  {
                    name: "unknownArray4", // same as unknownArray1
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                  {
                    name: "unknownData1",
                    type: "schema",
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    ],
                  },
                  {
                    name: "unknownArray5",
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                  {
                    name: "unknownArray6",
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                  {
                    name: "unknownArray7",
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                  {
                    name: "unknownArray8",
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                ],
              },
              {
                name: "acquireTimers",
                type: "schema",
                fields: [
                  {
                    name: "unknownArray1",
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                  /*{
                    name: "unknownArray2",
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },*/
                  { name: "unknownWord", type: "uint32", defaultValue: 0 },
                ],
              },
              /*{
                name: "acquireTimers",
                type: "schema",
                fields: [
                  {
                    name: "unknownArray1",
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                ],
              },*/
  
              {
                name: "unknownSchema2525",
                type: "schema",
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  {
                    name: "unknownSchema1",
                    type: "schema",
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    ],
                  },
                  {
                    name: "unknownSchema2",
                    type: "schema",
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    ],
                  },
                  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                ],
              },
              { name: "unknownDword2548", type: "uint32", defaultValue: 0 },
              {
                name: "unknownArray14154",
                type: "array",
                defaultValue: [],
                fields: [],
              },
              {
                name: "unknownSchema47522",
                type: "schema",
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  {
                    name: "unknownSchema4z7522",
                    type: "schema",
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    ],
                  },
                  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                ],
              },
  
              {
                name: "unknownArray1511125",
                type: "array",
                defaultValue: [],
                fields: [],
              },
              {
                name: "unknownArray1qsd5",
                type: "array",
                defaultValue: [],
                fields: [],
              },
              {
                name: "unknownArrayHello",
                type: "array",
                defaultValue: [],
                fields: [],
              },
              {
                name: "equipement_slot",
                type: "array",
                defaultValue: [],
                fields: [],
              },
  
              {
                name: "unknownArray1qqqsd5",
                type: "array",
                defaultValue: [],
                fields: [],
              },
  
              {
                name: "unknownSchema41722",
                type: "schema",
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  {
                    name: "unknownSchema475a22",
                    type: "schema",
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                      { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    ],
                  },
                  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "unknownSchema33334",
                type: "schema",
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                  { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                ],
              },
              {
                name: "unknownArray184d5",
                type: "array",
                defaultValue: [],
                fields: [],
              },
              {
                name: "accountItem", // that's a weird type i don't get it & it probably broke the sendself base schema
                type: "array",
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 2 },
                  { name: "unknownDword2", type: "uint32", defaultValue: 3 },
                  { name: "unknownDword3", type: "uint32", defaultValue: 4 },
                ],
              },
  
              {
                name: "itemTimerData",
                type: "schema",
                fields: [
                  {
                    name: "unknownData1",
                    type: "schema",
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      { name: "unknownFloat1", type: "float", defaultValue: 0 },
                      {
                        name: "unknownTime1",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                      {
                        name: "unknownTime2",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                    ],
                  },
                  {
                    name: "unknownArray1",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      {
                        name: "unknownDword1",
                        type: "uint32",
                        defaultValue: 0,
                      },
                      {
                        name: "unknownFloat1",
                        type: "float",
                        defaultValue: 0,
                      },
                      {
                        name: "unknownTime1",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                      {
                        name: "unknownTime2",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                    ],
                  },
                  {
                    name: "unknownData2",
                    type: "schema",
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      { name: "unknownFloat1", type: "float", defaultValue: 0 },
                      {
                        name: "unknownTime1",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                    ],
                  },
                  {
                    name: "unknownArray2",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownFloat1",
                            type: "float",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownTime1",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword2",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword3",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword4",
                            type: "uint32",
                            defaultValue: 0,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    name: "unknownArray3",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownFloat1",
                            type: "float",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownTime1",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword2",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword3",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownByte1",
                            type: "uint8",
                            defaultValue: 0,
                          },
                        ],
                      },
                    ],
                  },
                  {
                    name: "unknownArray4",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                      {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownFloat1",
                            type: "float",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownTime1",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword2",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword3",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword4",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownByte1",
                            type: "uint8",
                            defaultValue: 0,
                          },
                        ],
                      },
                    ],
                  },
                  { name: "unknownByte1", type: "uint8", defaultValue: 0 },
                ],
              },
              {
                name: "loadoutStuff",
                type: "schema",
                fields: [
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                  {
                    name: "unknownArray1",
                    type: "array",
                    defaultValue: [],
                    fields: [],
                  },
                  {
                    name: "unknownTime1",
                    type: "uint64string",
                    defaultValue: "0",
                  },
                ],
              },
              {
                name: "LocksPermissions",
                type: "array",
                defaultValue: [],
                fields: [],
              },
              {
                name: "missionData",
                type: "schema",
                fields: [
                  {
                    name: "unknownArray1",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownTime1",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownByte1",
                            type: "uint8",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword2",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword3",
                            type: "uint32",
                            defaultValue: 0,
                          },
                        ],
                      },
                      { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    ],
                  },
                  {
                    name: "unknownArray2",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownTime1",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownByte1",
                            type: "uint8",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword2",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword3",
                            type: "uint32",
                            defaultValue: 0,
                          },
                        ],
                      },
                      { name: "unknownFloat1", type: "float", defaultValue: 0 },
                    ],
                  },
                  {
                    name: "unknownArray3",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownTime1",
                            type: "uint64string",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownByte1",
                            type: "uint8",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword2",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownDword3",
                            type: "uint32",
                            defaultValue: 0,
                          },
                        ],
                      },
                      {
                        name: "unknownGuid1",
                        type: "uint64string",
                        defaultValue: 0,
                      },
                    ],
                  },
                  {
                    name: "unknownArray4",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                          {
                            name: "unknownData1",
                            type: "schema",
                            fields: [
                              {
                                name: "unknownDword1",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownTime1",
                                type: "uint64string",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownByte1",
                                type: "uint8",
                                defaultValue: 0,
                              },
                            ],
                          },
                          {
                            name: "unknownData2",
                            type: "schema",
                            fields: [
                              {
                                name: "unknownDword1",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownTime1",
                                type: "uint64string",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownByte1",
                                type: "uint8",
                                defaultValue: 0,
                              },
                            ],
                          },
                          {
                            name: "unknownData3",
                            type: "schema",
                            fields: [
                              {
                                name: "unknownDword1",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownDword2",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownDword3",
                                type: "uint32",
                                defaultValue: 0,
                              },
                            ],
                          },
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownData4",
                            type: "schema",
                            fields: [
                              {
                                name: "unknownDword1",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownDword2",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownDword3",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownDword4",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownVector1",
                                type: "floatvector4",
                                defaultValue: 0,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  {
                    name: "unknownArray5",
                    type: "array",
                    defaultValue: [],
                    fields: [
                      {
                        name: "unknownData1",
                        type: "schema",
                        fields: [
                          {
                            name: "unknownData1",
                            type: "schema",
                            fields: [
                              {
                                name: "unknownDword1",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownTime1",
                                type: "uint64string",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownByte1",
                                type: "uint8",
                                defaultValue: 0,
                              },
                            ],
                          },
                          {
                            name: "unknownData2",
                            type: "schema",
                            fields: [
                              {
                                name: "unknownDword1",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownTime1",
                                type: "uint64string",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownByte1",
                                type: "uint8",
                                defaultValue: 0,
                              },
                            ],
                          },
                          {
                            name: "unknownData3",
                            type: "schema",
                            fields: [
                              {
                                name: "unknownDword1",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownDword2",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownDword3",
                                type: "uint32",
                                defaultValue: 0,
                              },
                            ],
                          },
                          {
                            name: "unknownDword1",
                            type: "uint32",
                            defaultValue: 0,
                          },
                          {
                            name: "unknownData4",
                            type: "schema",
                            fields: [
                              {
                                name: "unknownDword1",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownDword2",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownDword3",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownDword4",
                                type: "uint32",
                                defaultValue: 0,
                              },
                              {
                                name: "unknownVector1",
                                type: "floatvector4",
                                defaultValue: 0,
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
  
              {
                name: "characterResources",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "resourceType", type: "uint32", defaultValue: 0 },
                  {
                    name: "resourceData",
                    type: "schema",
                    fields: resourceEventDataSubSchema,
                  },
                ],
              },
  
              /*{ seems to have been removed
                name: "characterResourceChargers",
                type: "array",
                defaultValue: [],
                fields: [],
              },*/
              {
                name: "skillPointData",
                type: "schema",
                fields: [
                  {
                    name: "skillPointsGranted",
                    type: "uint64string",
                    defaultValue: 0,
                  },
                  {
                    name: "skillPointsTotal",
                    type: "uint64string",
                    defaultValue: 0,
                  },
                  {
                    name: "skillPointsSpent",
                    type: "uint64string",
                    defaultValue: 0,
                  },
                  { name: "nextSkillPointPct", type: "double" },
                  { name: "unknownTime1", type: "uint64string", defaultValue: 0 },
                  { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                ],
              },
  
              {
                name: "skills",
                type: "array",
                defaultValue: [],
                fields: [
                  { name: "skillLineId", type: "uint32", defaultValue: 0 },
                  { name: "skillId", type: "uint32", defaultValue: 0 },
                ],
              },
              EquippedContainersSchema,
              { name: "unknownBoolean8", type: "boolean", defaultValue: true },
              { name: "unknownQword1", type: "uint64string", defaultValue: 0 },
              { name: "unknownDword38", type: "uint32", defaultValue: 0 },
              { name: "unknownQword2", type: "uint64string", defaultValue: 0 },
              { name: "unknownQword3", type: "uint64string", defaultValue: 0 },
              { name: "vehicleLoadoutId", type: "uint32", defaultValue: 0 },
              { name: "unknownDword40", type: "uint32", defaultValue: 0 },
              { name: "unknownBoolean9", type: "boolean", defaultValue: true },
              { name: "isFirstPersonOnly", type: "boolean", defaultValue: true },
            ],
          },
        ],
      },
    ],
    [
      "ClientIsReady",
      0x04,
      {
        fields: [],
      },
    ],
    [
      "ZoneDoneSendingInitialData",
      0x05,
      {
        fields: [],
      },
    ],
    ["ClientLogout", 0x07, {}],
    [
      "TargetClientNotOnline",
      0x08,
      {
        fields: [
          { name: "Unknown1", type: "uint32", defaultValue: 0 },
          { name: "Unknown2", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
    [
      "ClientBeginZoning",
      0x0b,
      {
        fields: [
          { name: "zoneName", type: "string", defaultValue: "Z1" },
          { name: "zoneType", type: "int32", defaultValue: 4 },
  
          { name: "position", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
          { name: "rotation", type: "floatvector4", defaultValue: [0, 0, 0, 1] },
  
          {
            name: "skyData",
            type: "schema",
            fields: skyData,
          },
          { name: "unknownBoolean1", type: "boolean", defaultValue: 0 },
          { name: "zoneId1", type: "uint32", defaultValue: 0 },
          { name: "zoneId2", type: "uint32", defaultValue: 0 },
          { name: "nameId", type: "uint32", defaultValue: 0 },
          { name: "unknownDword10", type: "uint32", defaultValue: 0 },
          { name: "unknownBoolean2", type: "boolean", defaultValue: false },
          { name: "unknownBoolean3", type: "boolean", defaultValue: false },
        ],
      },
    ],
    ["Mail", 0x0e, {}],
    ["MiniGame", 0x12, {}],
    ["Group", 0x13, {}],
    ["Encounter", 0x14, {}],
    ["Inventory", 0x15, {}],
    [
      "SendZoneDetails",
      0x16,
      {
        fields: [
          { name: "zoneName", type: "string", defaultValue: "" },
          { name: "zoneType", type: "uint32", defaultValue: 0 },
          { name: "unknownBoolean1", type: "boolean", defaultValue: false },
          {
            name: "skyData",
            type: "schema",
            fields: skyData,
          },
          { name: "zoneId1", type: "uint32", defaultValue: 0 },
          { name: "zoneId2", type: "uint32", defaultValue: 0 },
          { name: "nameId", type: "uint32", defaultValue: 0 },
          { name: "unknownBoolean7", type: "boolean", defaultValue: false },
        ],
      },
    ],
    ["Objective", 0x18, {}],
    ["Debug", 0x19, {}],
    ["Quest", 0x1b, {}],
    ["Reward", 0x1c, {}],
    [
      "GameTimeSync",
      0x1d,
      {
        fields: [
          { name: "time", type: "uint64string", defaultValue: "0" },
          { name: "cycleSpeed", type: "float", defaultValue: 0.0 },
          { name: "unknownBoolean", type: "boolean", defaultValue: false },
        ],
      },
    ],
    ["Pet", 0x1e, {}],
    ["PointOfInterestDefinitionRequest", 0x1f, {}],
    ["PointOfInterestDefinitionReply", 0x20, {}],
    ["WorldTeleportRequest", 0x21, {}],
    ["Trade", 0x22, {}],
    ["EscrowGivePackage", 0x23, {}],
    ["EscrowGotPackage", 0x24, {}],
    ["UpdateEncounterDataCommon", 0x25, {}],
    [
      "ReportReply",
      0x093600,
      {
        fields: [
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
    ["LiveGamer", 0x2a, {}],
    ["ClientServerShuttingDown", 0x2c, {}],
    ["Broadcast", 0x2e, {}],
    ["ClientKickedFromServer", 0x2f, {}],
    [
      "UpdateClientSessionData",
      0x30,
      {
        fields: [
          { name: "sessionId", type: "string", defaultValue: "" },
          { name: "stationName", type: "string", defaultValue: "" },
          { name: "unknownBoolean1", type: "boolean", defaultValue: false },
          { name: "unknownString1", type: "string", defaultValue: "" },
          { name: "unknownString2", type: "string", defaultValue: "" },
          { name: "stationCode", type: "string", defaultValue: "" },
          { name: "unknownString3", type: "string", defaultValue: "" },
        ],
      },
    ],
    ["BugSubmission", 0x31, {}],
    [
      "WorldDisplayInfo",
      0x32,
      {
        fields: [{ name: "worldId", type: "uint32", defaultValue: 0 }],
      },
    ],
    ["MOTD", 0x33, {}],
    [
      "SetLocale",
      0x34,
      {
        fields: [{ name: "locale", type: "string", defaultValue: "" }],
      },
    ],
    [
      "SetClientArea",
      0x35,
      {
        fields: [
          { name: "Unknown2", type: "uint32", defaultValue: 0 },
          { name: "Unknown3", type: "boolean", defaultValue: 0 },
          { name: "Unknown4", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
    ["ZoneTeleportRequest", 0x36, {}],
    ["TradingCard", 0x37, {}],
    [
      "WorldShutdownNotice",
      0x38,
      {
        fields: [
          { name: "timeLeft", type: "uint32", defaultValue: 0 },
          { name: "message", type: "string", defaultValue: "" },
          { name: "Unknown4", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
    ["LoadWelcomeScreen", 0x39, {}],
    ["ShipCombat", 0x3a, {}],
    ["AdminMiniGame", 0x3b, {}],
    [
      "KeepAlive",
      0x3c,
      {
        fields: [{ name: "gameTime", type: "uint32", defaultValue: 0 }],
      },
    ],
    [
      "ClientExitLaunchUrl",
      0x3d,
      {
        fields: [{ name: "url", type: "string", defaultValue: "0" }],
      },
    ],
    [
      "ClientPath",
      0x3e02,
      {
        fields: [
          { name: "unknownDword1", type: "uint32", defaultValue: 0 },
          { name: "unknownDword2", type: "uint32", defaultValue: 0 },
  
          {
            name: "unknownArray1",
            type: "array",
            defaultValue: [],
            fields: [
              {
                name: "unknownfloatVector1",
                type: "floatvector4",
                defaultValue: [0, 0, 0, 0],
              },
            ],
          },
        ],
      },
    ],
    ["ClientPendingKickFromServer", 0x3f, {}],
    [
      "MembershipActivation",
      0x40,
      {
        fields: [{ name: "unknown", type: "uint32", defaultValue: 0 }],
      },
    ],
    
    [
      "ShowSystemMessage",
      0x43,
      {
        fields: [
          { name: "Unknown2", type: "uint32", defaultValue: 0 },
          {
            name: "UnknownString",
            type: "string",
            defaultValue: "hello",
          },
          { name: "Unknown3", type: "uint32", defaultValue: 0 },
          { name: "Unknown4", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
    [
      "POIChangeMessage",
      0x44,
      {
        fields: [
          { name: "messageStringId", type: "uint32", defaultValue: 20 },
          { name: "id", type: "uint32", defaultValue: 1 },
          { name: "unknown4", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
    ["ClientMetrics", 0x45, {
      fields: [
        { name: "unknown1", type: "uint64string", defaultValue: "0" },
        { name: "unknown2", type: "uint32", defaultValue: 0 },
        { name: "unknown3", type: "uint32", defaultValue: 0 },
        { name: "unknown4", type: "uint32", defaultValue: 0 },
        { name: "unknown5", type: "uint32", defaultValue: 0 },
        { name: "unknown6", type: "uint32", defaultValue: 0 },
        { name: "unknown7", type: "uint32", defaultValue: 0 },
        { name: "unknown8", type: "uint32", defaultValue: 0 },
        { name: "unknown9", type: "uint32", defaultValue: 0 },
        { name: "unknown10", type: "uint32", defaultValue: 0 },
        { name: "unknown11", type: "uint32", defaultValue: 0 },
        { name: "unknown12", type: "uint32", defaultValue: 0 },
        { name: "unknown13", type: "uint32", defaultValue: 0 },
        { name: "unknown14", type: "uint32", defaultValue: 0 },
        { name: "unknown15", type: "uint32", defaultValue: 0 },
        { name: "unknown16", type: "uint32", defaultValue: 0 },
        { name: "unknown17", type: "uint32", defaultValue: 0 },
        { name: "unknown18", type: "uint32", defaultValue: 0 },
        { name: "unknown19", type: "uint32", defaultValue: 0 },
        { name: "unknown20", type: "uint32", defaultValue: 0 },
        { name: "unknown21", type: "uint32", defaultValue: 0 },
      ],
    }],
    ["FirstTimeEvent", 0x46, {}],
    ["Claim", 0x47, {}],
    [
      "ClientLog",
      0x48,
      {
        fields: [
          { name: "file", type: "string", defaultValue: "" },
          { name: "message", type: "string", defaultValue: "" },
        ],
      },
    ],
    ["Ignore", 0x49, {}],
    ["SnoopedPlayer", 0x4a, {}],
    ["Promotional", 0x4b, {}],
    ["AddClientPortraitCrc", 0x4c, {}],
    ["ObjectiveTarget", 0x4d, {}],
    ["CommerceSessionRequest", 0x4e, {}],
    ["CommerceSessionResponse", 0x4f, {}],
    ["TrackedEvent", 0x50, {}],
    ["LoginFailed", 0x51, { fields: [] }],
    ["LoginToUChat", 0x52, {}],
    ["ZoneSafeTeleportRequest", 0x53, {}],
    ["RemoteInteractionRequest", 0x54, {}],
    ["UpdateCamera", 0x57, {}],
    ["AdminGuild", 0x59, {}],
    ["BattleMages", 0x5a, {}],
    ["WorldToWorld", 0x5b, {}],
    ["PerformAction", 0x5c, {}],
    ["EncounterMatchmaking", 0x5d, {}],
    ["ClientLuaMetrics", 0x5e, {}],
    ["RepeatingActivity", 0x5f, {}],
    [
      "ClientGameSettings",
      0x60,
      {
        fields: [
          { name: "Unknown2", type: "uint32", defaultValue: 0 },
          { name: "interactGlowAndDist", type: "uint32", defaultValue: 3 }, // client doesnt send interactionstring by distance but still sends interactrequest
          { name: "unknownBoolean1", type: "boolean", defaultValue: 0 },
          { name: "timescale", type: "float", defaultValue: 2.0 },
          { name: "Unknown4", type: "uint32", defaultValue: 0 },
          { name: "Unknown5", type: "uint32", defaultValue: 0 },
          { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
          { name: "velDamageMulti", type: "float", defaultValue: 1.0 }, // 0 = crash
        ],
      },
    ],
    ["ClientTrialProfileUpsell", 0x61, {}],
  
    ["RequestSendItemDefinitionsToClient", 0x63, {}],
    ["Inspect", 0x64, {}],
    
    [
      "PlayerTitle",
      0x66,
      {
        fields: [
          { name: "unknown1", type: "uint8", defaultValue: 0 },
          { name: "titleId", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
    ["Fotomat", 0x67, {
      fields: [],
    }],
    ["UpdateUserAge", 0x68, {}],
    ["ActionBarManager", 0x6a, {}],
    ["ClientTrialProfileUpsellRequest", 0x6b, {}],
    ["PlayerUpdateJump", 0x6c, {}],
    
    [
      "InitializationParameters",
      0x6e,
      {
        fields: [
          { name: "environment", type: "string", defaultValue: "" },
          { name: "serverId", type: "uint32", defaultValue: 0 },
        ],
      },
    ],
  
    
    [
      "ClientInitializationDetails",
      0x71,
      {
        fields: [{ name: "unknownDword1", type: "uint32", defaultValue: 0 }],
      },
    ],
    [
      "ClientAreaTimer",
      0x72,
      {
        fields: [
          { name: "Unknown2", type: "uint32", defaultValue: 10 },
          { name: "Unknown3", type: "uint32", defaultValue: 10 },
          {
            name: "Unknown4",
            type: "uint64string",
            defaultValue: "0x0000000000000010",
          },
        ],
      },
    ],
    ["LoyaltyReward.GiveLoyaltyReward", 0x7301, {}],
    ["Rating", 0x74, {}],
    ["ClientActivityLaunch", 0x75, {}],
    ["ServerActivityLaunch", 0x76, {}],
    ["ClientFlashTimer", 0x77, {}],
    [
      "PlayerUpdate.UpdatePosition",
      0x78,
      {
        fields: [
          {
            name: "transientId",
            type: "custom",
            parser: readUnsignedIntWith2bitLengthValue,
            packer: packUnsignedIntWith2bitLengthValue,
            defaultValue: 1,
          },
          {
            name: "positionUpdate",
            type: "custom",
            parser: readPositionUpdateData,
            packer: packPositionUpdateData,
          },
        ],
      },
    ],
    ["InviteAndStartMiniGame", 0x79, {}],
    ["PlayerUpdate.Flourish", 0x7a, {}],
    ["Quiz", 0x7b, {}],
    ["PlayerUpdate.PositionOnPlatform", 0x7c, {}],
    ["ClientMembershipVipInfo", 0x7d, {}],
   
    ["GuideStone", 0x7f, {}],
    ["Raid", 0x80, {}],
    
    [
      "Weapon.Weapon",
      0x8200,
      {
        fields: [
          {
            name: "weaponPacket",
            type: "custom",
            parser: parseWeaponPacket,
            packer: packWeaponPacket,
          },
        ],
      },
    ],
    ["Grief", 0x89, {}],
    ["SpotPlayer", 0x8a, {}],
    ["Faction", 0x8b, {}],
    [
      "Synchronization",
      0x8c,
      {
        fields: [
          { name: "time1", type: "uint64string", defaultValue: "0" },
          { name: "time2", type: "uint64string", defaultValue: "0" },
          { name: "clientTime", type: "uint64string", defaultValue: "0" },
          { name: "serverTime", type: "uint64string", defaultValue: "0" },
          { name: "serverTime2", type: "uint64string", defaultValue: "0" },
          { name: "time3", type: "uint64string", defaultValue: "0" },
        ],
      },
    ],
    [
      "ResourceEvent",
      0x8d00,
      {
        fields: [
          { name: "gameTime", type: "uint32", defaultValue: 0 },
          {
            name: "eventData",
            type: "variabletype8",
            types: {
              1: [
                // SetCharacterResources
                { name: "characterId", type: "uint64string", defaultValue: "0" },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    {
                      name: "unknownData1",
                      type: "schema",
                      fields: resourceEventDataSubSchema,
                    },
                  ],
                },
              ],
              2: [
                // SetCharacterResource
                { name: "characterId", type: "uint64string", defaultValue: "0" },
                { name: "resourceId", type: "uint32", defaultValue: 0 },
                { name: "resourceType", type: "uint32", defaultValue: 0 },
                {
                  name: "unknownArray1",
                  type: "array",
                  defaultValue: [],
                  fields: [
                    { name: "unknownDword1", type: "float", defaultValue: 0.0 },
                    { name: "unknownDword2", type: "float", defaultValue: 0.0 },
                    { name: "unknownDword3", type: "float", defaultValue: 0.0 },
                    { name: "unknownDword4", type: "float", defaultValue: 0.0 },
                  ],
                },
                { name: "initialValue", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownFloat5", type: "float", defaultValue: 0.0 },
                { name: "unknownFloat6", type: "float", defaultValue: 0.0 },
                { name: "unknownFloat7", type: "float", defaultValue: 0.0 },
                { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                { name: "unknownDword9", type: "uint32", defaultValue: 0 },
                { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
                { name: "unknownByte2", type: "uint8", defaultValue: 0 },
                { name: "unknownGuid3", type: "uint64string", defaultValue: "0" },
                { name: "unknownGuid4", type: "uint64string", defaultValue: "0" },
                { name: "unknownGuid5", type: "uint64string", defaultValue: "0" },
              ],
              3: [
                // UpdateCharacterResource
                { name: "characterId", type: "uint64string", defaultValue: "0" },
                { name: "resourceId", type: "uint32", defaultValue: 0 },
                { name: "resourceType", type: "uint32", defaultValue: 0 },
  
                { name: "initialValue", type: "uint32", defaultValue: 0 },
                { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                { name: "unknownFloat5", type: "float", defaultValue: 0.0 },
                { name: "unknownFloat6", type: "float", defaultValue: 0.0 },
                { name: "unknownFloat7", type: "float", defaultValue: 0.0 },
                { name: "unknownDword8", type: "uint32", defaultValue: 0 },
                { name: "unknownDword9", type: "uint32", defaultValue: 0 },
                { name: "unknownDword10", type: "uint32", defaultValue: 0 },
  
                { name: "unknownByte1", type: "uint8", defaultValue: 0 },
                { name: "unknownByte2", type: "uint8", defaultValue: 0 },
                { name: "unknownGuid3", type: "uint64string", defaultValue: "0" },
                { name: "unknownGuid4", type: "uint64string", defaultValue: "0" },
                { name: "unknownGuid5", type: "uint64string", defaultValue: "0" },
  
                { name: "unknownBoolean", type: "boolean", defaultValue: false },
              ],
              4: [
                // RemoveCharacterResource
              ],
            },
          },
        ],
      },
    ],
    ["Leaderboard", 0x8f, {}],
    [
      "PlayerUpdateManagedPosition",
      0x90,
      {
        fields: [
          {
            name: "transientId",
            type: "custom",
            parser: readUnsignedIntWith2bitLengthValue,
            packer: packUnsignedIntWith2bitLengthValue,
          },
          {
            name: "PositionUpdate",
            type: "custom",
            parser: readPositionUpdateData,
            packer: packPositionUpdateData,
            defaultValue: 1,
          },
        ],
      },
    ],
    [
      "PlayerUpdateNetworkObjectComponents",
      0x91,
      {
        // wip
        fields: [
          {
            name: "transientId",
            type: "custom",
            parser: readUnsignedIntWith2bitLengthValue,
            packer: packUnsignedIntWith2bitLengthValue,
          },
          { name: "unk1", type: "uint32", defaultValue: 0 },
          {
            name: "unknownArray1",
            type: "array",
            defaultValue: [],
            fields: [],
          },
        ],
      },
    ],
    ["PlayerUpdateUpdateVehicleWeapon", 0x92, {}],
    [
      "ContinentBattleInfo",
      0x96,
      {
        fields: [
          {
            name: "zones",
            type: "array",
            defaultValue: [],
            fields: [
              { name: "id", type: "uint32", defaultValue: 0 },
              { name: "nameId", type: "uint32", defaultValue: 0 },
              { name: "descriptionId", type: "uint32", defaultValue: 0 },
              {
                name: "population",
                type: "array",
                defaultValue: [],
                elementType: "uint8",
              },
              {
                name: "regionPercent",
                type: "array",
                defaultValue: [],
                elementType: "uint8",
              },
              {
                name: "populationBuff",
                type: "array",
                defaultValue: [],
                elementType: "uint8",
              },
              {
                name: "populationTargetPercent",
                type: "array",
                defaultValue: [],
                elementType: "uint8",
              },
              { name: "name", type: "string", defaultValue: "" },
              { name: "hexSize", type: "float", defaultValue: 0.0 },
              { name: "isProductionZone", type: "uint8", defaultValue: 0 },
            ],
          },
        ],
      },
    ],
    [
      "GetContinentBattleInfo",
      0x97,
      {
        fields: [],
      },
    ],
    [
      "GetRespawnLocations",
      0x98,
      {
        fields: [],
      },
    ],
    ["ClientInGamePurchase", 0x9c, {}],
    [
      "Security",
      0xa2,
      {
        fields: [{ name: "code", type: "uint32", defaultValue: 0 }],
      },
    ],
    
    ["Hud", 0xa4, {}],
    ["AcquireTimer", 0xa6, {}],
    ["PlayerUpdateGuildTag", 0xa7, {}],
    ["LoginQueueStatus", 0xa9, {}],
    [
      "ServerPopulationInfo",
      0xaa,
      {
        fields: [
          {
            name: "population",
            type: "array",
            defaultValue: [],
            elementtype: "uint16",
          },
          {
            name: "populationPercent",
            type: "array",
            defaultValue: [],
            elementType: "uint8",
          },
          {
            name: "populationBuff",
            type: "array",
            defaultValue: [],
            elementType: "uint8",
          },
        ],
      },
    ],
    [
      "GetServerPopulationInfo",
      0xab,
      {
        fields: [],
      },
    ],
    [
      "PlayerUpdate.VehicleCollision",
      0xac,
      {
        fields: [
          {
            name: "transientId",
            type: "custom",
            parser: readUnsignedIntWith2bitLengthValue,
            packer: packUnsignedIntWith2bitLengthValue,
          },
          { name: "damage", type: "float", defaultValue: 0.0 },
        ],
      },
    ],
    [
      "PlayerUpdate.Stop",
      0xad,
      {
        fields: [
          {
            name: "unknownUint",
            type: "custom",
            parser: readUnsignedIntWith2bitLengthValue,
            packer: packUnsignedIntWith2bitLengthValue,
          },
        ],
      },
    ],
    [
      "PlayerUpdate.AttachObject",
      0xb0,
      {
        fields: [
          // WIP
          {
            name: "objects",
            type: "array",
            defaultValue: [],
            fields: [
              {
                name: "targetObjectId",
                type: "uint64string",
                defaultValue: "0x0000000000000001",
              },
              {
                name: "position",
                type: "floatvector4",
                defaultValue: [0, 50, 0, 1],
              },
              {
                name: "rotation",
                type: "floatvector4",
                defaultValue: [0, 0, 0, 1],
              },
              { name: "unk4", type: "uint32", defaultValue: 9001 },
              { name: "unk5", type: "uint32", defaultValue: 9851 },
              { name: "unk6", type: "uint32", defaultValue: 9001 },
              { name: "unk7", type: "uint32", defaultValue: 9851 },
            ],
          },
        ],
      },
    ],
    ["PlayerUpdate.DetachObject", 0xb1, {}],
    [
      "ClientSettings",
      0xb2,
      {
        fields: [
          { name: "helpUrl", type: "string", defaultValue: "" },
          { name: "shopUrl", type: "string", defaultValue: "" },
          { name: "shop2Url", type: "string", defaultValue: "" },
        ],
      },
    ],
    [
      "RewardBuffInfo",
      0xb3,
      {
        fields: [
          { name: "unknownFloat1", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat2", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat3", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat4", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat5", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat6", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat7", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat8", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat9", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat10", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat11", type: "float", defaultValue: 0.0 },
          { name: "unknownFloat12", type: "float", defaultValue: 0.0 },
        ],
      },
    ],
    [
      "GetRewardBuffInfo",
      0xb4,
      {
        fields: [],
      },
    ],
    ["Cais", 0xb5, {}],
    ["RequestPromoEligibilityUpdate", 0xb7, {}],
    ["PromoEligibilityReply", 0xb8, {}],
    ["RequestWalletTopupUpdate", 0xba, {}],
    ["RequestStationCashActivePromoUpdate", 0xbb, {}],
    ["CharacterSlot", 0xbc, {}],
    ["ProxiedPlayer", 0xc2, {}],
    ["Resist", 0xc3, {}],
    ["InGamePurchasing", 0xc4, {}],
    ["BusinessEnvironments", 0xc5, {}],
    ["EmpireScore", 0xc6, {}],
    [
      "CharacterSelectSessionRequest",
      0xc7,
      {
        fields: [],
      },
    ],
    [
      "CharacterSelectSessionResponse",
      0xc8,
      {
        fields: [
          { name: "status", type: "uint8", defaultValue: 0 },
          { name: "sessionId", type: "string", defaultValue: "" },
        ],
      },
    ],
    ["Stats", 0xc9, {}],
    ["Resource", 0xca, {}],
    [
      "SkyChanged",
      0xcd,
      {
        fields: skyData,
      },
    ],
    ["NavGen", 0xce, {}],
    ["Locks", 0xcf, {}],
  ]