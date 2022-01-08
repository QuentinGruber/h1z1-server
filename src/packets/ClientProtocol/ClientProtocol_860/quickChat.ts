


export const quickChatPackets:any = [
    [
        "QuickChat.SendData",
        0x280100,
        {
          fields: [
            {
              name: "commands",
              type: "array",
              defaultValue: [],
              fields: [
                { name: "commandId", type: "uint32", defaultValue: 0 },
                {
                  name: "commandData",
                  type: "schema",
                  fields: [
                    { name: "commandId", type: "uint32", defaultValue: 0 },
                    { name: "menuStringId", type: "uint32", defaultValue: 0 },
                    { name: "chatStringId", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword1", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword2", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword3", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword4", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword5", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword6", type: "uint32", defaultValue: 0 },
                    { name: "unknownDword7", type: "uint32", defaultValue: 0 },
                  ],
                },
              ],
            },
          ],
        },
      ],
      ["QuickChat.SendTell", 0x2802, {}],
      ["QuickChat.SendChatToChannel", 0x2803, {}],

]