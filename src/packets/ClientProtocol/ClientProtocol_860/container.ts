import { EquippedContainersSchema } from "./shared";



export const containerPackets:any = [
    [
        "Container.InitEquippedContainers",
        0xcb02,
        {
          fields: [
            { name: "Unknown2", type: "uint16", defaultValue: 0 },
            EquippedContainersSchema,
          ],
        },
      ],
      ["Container.Error", 0xcb03, {}],
      ["Container.PacketListAll", 0xcb05, {}],
      ["Container.UpdateEquippedContainer", 0xcb06, {}],

]