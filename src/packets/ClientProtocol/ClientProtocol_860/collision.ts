


export const collisionPackets:any = [

    [
        "Collision.Damage",
        0x8e01,
        {
          fields: [
            { name: "unknownByte1", type: "uint8", defaultValue: 0 },
            { name: "characterId", type: "uint64string", defaultValue: "0" },
            { name: "objectCharacterId", type: "uint64string", defaultValue: 0 },
            { name: "unknownDword1", type: "uint32", defaultValue: 0 },
            { name: "damage", type: "uint32", defaultValue: 0 },
            { name: "unknownDword2", type: "uint32", defaultValue: 0 },
            { name: "position", type: "floatvector3", defaultValue: 0 },
            { name: "unknownByte2", type: "uint8", defaultValue: 0 },
          ],
        },
      ],
]