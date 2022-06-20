import fs from "fs";
const serverItemDef = require("../data/2016/dataSources/serverItemDefinitions.json");

export interface ServerItemDef {
    NAME: string;
    ID: number;
    CODE_FACTORY_NAME: string;
    NAME_ID: number;
    DESCRIPTION_ID: number;
    IMAGE_SET_ID: number;
    ACTIVATABLE_ABILITY_ID: number;
    PASSIVE_ABILITY_ID: number;
    COST: number;
    ITEM_CLASS: number;
    MAX_STACK_SIZE: number;
    MIN_STACK_SIZE: number;
    PROFILE_OVERRIDE: number;
    NO_TRADE: number;
    SINGLE_USE: number;
    MODEL_NAME: string;
    GENDER_USAGE: number;
    TEXTURE_ALIAS: string;
    SHADER_PARAMETER_GROUP_ID: number;
    CATEGORY_ID: number;
    MEMBERS_ONLY: number;
    NON_MINI_GAME: number;
    PARAM1: number;
    PARAM2: number;
    PARAM3: number;
    NO_SALE: number;
    WEAPON_TRAIL_EFFECT_ID: number;
    USE_REQUIREMENT_ID: number;
    CLIENT_USE_REQUIREMENT_ID: number;
    COMPOSITE_EFFECT_ID: number;
    POWER_RATING: number;
    MIN_PROFILE_RANK: number;
    RARITY: number;
    CONTENT_ID: number;
    NO_LIVE_GAMER: number;
    COMBAT_ONLY: number;
    FORCE_DISABLE_PREVIEW: number;
    MEMBER_DISCOUNT: number;
    RACE_SET_ID: number;
    VIP_RANK_REQUIRED: number;
    PERSIST_PROFILE_SWITCH: number;
    FLAG_QUICK_USE: number;
    FLAG_CAN_EQUIP: number;
    FLAG_ACCOUNT_SCOPE: number;
    UI_MODEL_CAMERA_ID: number;
    EQUIP_COUNT_MAX: number;
    CURRENCY_TYPE: number;
    DATASHEET_ID: number;
    ITEM_TYPE: number;
    SKILL_SET_ID: number;
    OVERLAY_TEXTURE: string;
    DECAL_SLOT: string;
    OVERLAY_ADJUSTMENT: number;
    TRIAL_DURATION_SEC: number;
    NEXT_TRIAL_DELAY_SEC: number;
    PASSIVE_ABILITY_SET_ID: number;
    HUD_IMAGE_SET_ID: number;
    OVERRIDE_APPEARANCE: string;
    OVERRIDE_CAMERA_ID: number;
    PLAYER_STUDIO_DISPLAY_NAME: string;
    STRING_PARAM1: string;
    BULK: number;
    ACTIVE_EQUIP_SLOT_ID: number;
    PASSIVE_EQUIP_SLOT_ID: number;
    USE_ITEM_RETICLE_ID: number;
    GRINDER_REWARD_SET_ID: number;
    BUILD_BAR_GROUP_ID: number;
    FLAG_NO_DRAG_DROP: number;
    INTERACTION_ANIMATION_ID: number;
    IS_ARMOR: number;
    PASSIVE_EQUIP_SLOT_GROUP_ID: number;
    SCRAP_VALUE_OVERRIDE: number;
  }

  const ignoredModels = ["Survivor<gender>001_baseballcap_tan.adr","Survivor<gender>_Ivan_Backpacks_Satchel_Makeshift.adr"]
  
const serverItemValues:ServerItemDef[] = Object.values(serverItemDef);
const modelTexture: Record<number, Record<string,string[]>> = {}
for (let index = 0; index < serverItemValues.length; index++) {
    const element:ServerItemDef = serverItemValues[index];
    if(element.FLAG_CAN_EQUIP && element.MODEL_NAME && !ignoredModels.includes(element.MODEL_NAME)){
        if(!modelTexture[element.PASSIVE_EQUIP_SLOT_ID]){
            modelTexture[element.PASSIVE_EQUIP_SLOT_ID] = {}
        }
        if(!modelTexture[element.PASSIVE_EQUIP_SLOT_ID][element.MODEL_NAME]){
            modelTexture[element.PASSIVE_EQUIP_SLOT_ID][element.MODEL_NAME] = []
        }
        if (modelTexture[element.PASSIVE_EQUIP_SLOT_ID][element.MODEL_NAME].indexOf(element.TEXTURE_ALIAS) === -1) {
            modelTexture[element.PASSIVE_EQUIP_SLOT_ID][element.MODEL_NAME].push(element.TEXTURE_ALIAS)
        }

    }    
}
fs.writeFileSync("./data/2016/sampleData/equipmentModelTexturesMapping.json", JSON.stringify(modelTexture, null, 2));