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

import { randomInt } from "node:crypto";
import { ZoneClient2016 } from "../classes/zoneclient";
import { ZoneServer2016 } from "../zoneserver";
import { Collection } from "mongodb";

export enum ChallengeType {
  NONE,
  TREE_HATER,
  NO_WASTE,
  DAWN_ITS_TASTY,
  CARDIO_ISSUES,
  BRAIN_DEAD,
  RECYCLING,
  MY_HOME,
  TIRED_BUDDY,
  LIGHTER,
  MY_LAND,
  PV_PD_SURVIVAL,
  GLOBAL_DISARMAMENT,
  ROCKY,
  ROCKSTAR,
  IED,
  RANCHITO,
  SWIZZLE
}
export enum ChallengeStatus {
  CURRENT = 1,
  DONE = 2,
  TIMED_OUT = 3
}
export enum ChallengeDifficulty {
  EASY = 1,
  MEDIUM = 2,
  HARD = 3
}
export interface ChallengeInfo {
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  name: string;
  description: string;
  neededPoints: number;
  pvpOnly: boolean;
}
export interface ChallengeData {
  _id?: string;
  serverId: number;
  playerGuid: string;
  date: Date;
  type: ChallengeType;
  status: ChallengeStatus;
  points: number;
}

export class ChallengeManager {
  challenges: ChallengeInfo[];
  challengesCollection!: Collection<ChallengeData>;
  // managed by config
  challengesPerDay: number = 3;
  enabled: boolean = true;
  constructor(public server: ZoneServer2016) {
    this.challenges = [
      {
        type: ChallengeType.TREE_HATER,
        difficulty: ChallengeDifficulty.EASY,
        name: "Tree hater",
        description: "Cut 10 trees",
        neededPoints: 10,
        pvpOnly: false
      },
      {
        type: ChallengeType.NO_WASTE,
        difficulty: ChallengeDifficulty.EASY,
        name: "No waste",
        description: "Repair a gun",
        neededPoints: 1,
        pvpOnly: false
      },
      {
        type: ChallengeType.DAWN_ITS_TASTY,
        difficulty: ChallengeDifficulty.EASY,
        name: "Dawn it's tasty",
        description: "Harvest 40 blackberries",
        neededPoints: 40,
        pvpOnly: false
      },
      {
        type: ChallengeType.CARDIO_ISSUES,
        difficulty: ChallengeDifficulty.EASY,
        name: "Cardio deficiency detected",
        description: "Run out of stamina",
        neededPoints: 1,
        pvpOnly: false
      },
      {
        type: ChallengeType.RANCHITO,
        difficulty: ChallengeDifficulty.EASY,
        name: "Wait... Why am i here again?",
        description: "Visit Ranchito",
        neededPoints: 1,
        pvpOnly: false
      },
      {
        type: ChallengeType.BRAIN_DEAD,
        difficulty: ChallengeDifficulty.MEDIUM,
        name: "They're brain-dead anyway",
        description: "Kill 50 zombies",
        neededPoints: 50,
        pvpOnly: false
      },
      {
        type: ChallengeType.RECYCLING,
        difficulty: ChallengeDifficulty.MEDIUM,
        name: "RECYCLING",
        description: "Get 40 scraps from vehicles",
        neededPoints: 40,
        pvpOnly: false
      },
      {
        type: ChallengeType.MY_HOME,
        difficulty: ChallengeDifficulty.MEDIUM,
        name: "This is my home",
        description: "Craft a shack",
        neededPoints: 1,
        pvpOnly: false
      },
      {
        type: ChallengeType.TIRED_BUDDY,
        difficulty: ChallengeDifficulty.MEDIUM,
        name: "Tired buddy",
        description: "Survive until being tired",
        neededPoints: 1,
        pvpOnly: false
      },
      // Too easy to abuse rn
      // {
      //   type: ChallengeType.LIGHTER,
      //   difficulty: ChallengeDifficulty.MEDIUM,
      //   name: "You light up my life",
      //   description: "Find 10 lighters",
      //   neededPoints: 10,
      //   pvpOnly: false
      // },
      {
        type: ChallengeType.MY_LAND,
        difficulty: ChallengeDifficulty.MEDIUM,
        name: "My land!",
        description: "Craft a deck foundation",
        neededPoints: 1,
        pvpOnly: false
      },
      {
        type: ChallengeType.SWIZZLE,
        difficulty: ChallengeDifficulty.MEDIUM,
        name: "Shady buisness",
        description: "Consume some swizzle",
        neededPoints: 1,
        pvpOnly: false
      },
      {
        type: ChallengeType.PV_PD_SURVIVAL,
        difficulty: ChallengeDifficulty.HARD,
        name: "Proving a point",
        description: "Survive 30 minutes in pv pd",
        neededPoints: 30,
        pvpOnly: true
      },
      {
        type: ChallengeType.GLOBAL_DISARMAMENT,
        difficulty: ChallengeDifficulty.HARD,
        name: "GLOBAL DISARMAMENT",
        description: "Fire 60 bullets of any gun",
        neededPoints: 60,
        pvpOnly: false
      },
      {
        type: ChallengeType.ROCKY,
        difficulty: ChallengeDifficulty.HARD,
        name: "Rocky",
        description: "Kill 2 players with your fists",
        neededPoints: 2,
        pvpOnly: true
      },
      {
        type: ChallengeType.ROCKSTAR,
        difficulty: ChallengeDifficulty.HARD,
        name: "Rockstar!!!",
        description: "Kill someone with a guitar",
        neededPoints: 1,
        pvpOnly: true
      },
      {
        type: ChallengeType.IED,
        difficulty: ChallengeDifficulty.HARD,
        name: "Let's blow this joint",
        description: "Craft 15 IEDS",
        neededPoints: 15,
        pvpOnly: false
      }
    ];
  }

  scheduleExpires(time?: number) {
    if (!time) {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(23, 59, 59, 0);
      time = midnight.getTime() - now.getTime();
    }
    console.log(`Challenges expires in ${(time / 60_000).toFixed(0)} minutes`);
    setTimeout(() => {
      this.expireChallenges();
      this.scheduleExpires(24 * 3600 * 1000);
    }, time);
  }

  async expireChallenges() {
    await this.challengesCollection.updateMany(
      { date: { $lt: new Date() } },
      { $set: { status: ChallengeStatus.TIMED_OUT } }
    );

    for (const c in this.server._clients) {
      const client = this.server._clients[c];
      this.affectChallenge(client);
    }
  }

  init(collection: Collection<ChallengeData>) {
    if (this.enabled) {
      this.challengesCollection = collection;
      this.scheduleExpires();
    }
  }

  getChallengeInfo(type: ChallengeType): ChallengeInfo | undefined {
    return this.challenges.find((e: ChallengeInfo) => e.type === type);
  }

  async loadChallenges(client: ZoneClient2016) {
    if (this.server._soloMode || !this.enabled) {
      return;
    }
    const currentChallenge = await this.getCurrentChallengeData(client);
    if (!currentChallenge) {
      this.affectChallenge(client);
    } else {
      client.character.currentChallenge = currentChallenge.type;
      this.displayChallengeInfos(client);
    }
  }

  async getCurrentChallengeData(
    client: ZoneClient2016
  ): Promise<ChallengeData | undefined> {
    if (this.server._soloMode) {
      this.server.sendAlert(
        client,
        "Challenges aren't available for solomode yet."
      );
    } else {
      const query = {
        status: ChallengeStatus.CURRENT,
        serverId: this.server._worldId,
        playerGuid: client.loginSessionId
      };
      const challengeData = await this.challengesCollection.findOne(query);
      return challengeData ?? undefined;
    }
  }

  async displayChallengeInfos(client: ZoneClient2016) {
    const cInfos = this.getChallengeInfo(client.character.currentChallenge);
    let message: string;
    if (cInfos) {
      const challengeData = await this.getCurrentChallengeData(client);
      message = `Challenge "${cInfos.name}": ${cInfos.description}`;
      if (
        cInfos.neededPoints > 1 &&
        cInfos.neededPoints !== challengeData?.points
      ) {
        message += `\n Progression: ${challengeData?.points}/${cInfos.neededPoints}`;
      } else if (cInfos.neededPoints === challengeData?.points) {
        message += ` Accomplished!`;
      }
    } else {
      message = `No more challenges for today. (${this.challengesPerDay})`;
    }
    this.server.sendAlert(client, message);
  }

  async registerChallengeProgression(
    client: ZoneClient2016,
    challengeType: ChallengeType,
    pointsToAdd: number
  ) {
    if (challengeType !== client.character.currentChallenge) {
      return;
    }
    const currentChallenge = await this.getCurrentChallengeData(client);
    if (!currentChallenge) {
      this.server.sendAlert(client, "no current challenge");
      return;
    }

    const points = currentChallenge.points + pointsToAdd;
    const challengeInfo = this.getChallengeInfo(currentChallenge.type);
    if (!challengeInfo) {
      return;
    }

    if (this.server._soloMode) {
      // nothing
    } else {
      await this.challengesCollection.updateOne(
        { _id: currentChallenge._id },
        { $set: { points } }
      );
      await this.displayChallengeInfos(client);
      if (points >= challengeInfo.neededPoints) {
        this.finishChallenge(client);
      }
    }
  }

  async finishChallenge(client: ZoneClient2016) {
    if (client.character.currentChallenge === ChallengeType.NONE) {
      return;
    }
    client.character.currentChallenge = ChallengeType.NONE;
    const query = {
      status: ChallengeStatus.CURRENT,
      serverId: this.server._worldId,
      playerGuid: client.loginSessionId
    };
    await this.challengesCollection.updateOne(query, {
      $set: { status: ChallengeStatus.DONE }
    });
    this.server.rewardManager.dropReward(client);
    setTimeout(() => {
      this.affectChallenge(client);
    }, 5000);
  }

  async affectChallenge(client: ZoneClient2016) {
    const now = Date.now();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const challengesToday = await this.challengesCollection
      .find({
        date: { $gte: startOfDay, $lt: endOfDay },
        serverId: this.server._worldId,
        status: { $ne: ChallengeStatus.TIMED_OUT },
        playerGuid: client.loginSessionId
      })
      .toArray();
    if (challengesToday.length >= this.challengesPerDay) {
      client.character.currentChallenge = ChallengeType.NONE;
      this.displayChallengeInfos(client);
      return;
    }
    const challengesTypesDoneToday = challengesToday.map((e) => {
      return e.type;
    });
    const currentProgression: number =
      challengesToday.length / this.challengesPerDay;
    let nextDifficultyChallenge: ChallengeDifficulty;
    if (currentProgression < 0.3) {
      nextDifficultyChallenge = ChallengeDifficulty.EASY;
    } else if (currentProgression < 0.6) {
      nextDifficultyChallenge = ChallengeDifficulty.MEDIUM;
    } else {
      nextDifficultyChallenge = ChallengeDifficulty.HARD;
    }
    const challengesAvailable = this.challenges.filter((v) => {
      return (
        !challengesTypesDoneToday.includes(v.type) &&
        (!v.pvpOnly || !this.server.isPvE) &&
        v.difficulty === nextDifficultyChallenge
      );
    });
    if (challengesAvailable.length) {
      const rnd_index = randomInt(challengesAvailable.length);
      const challenge = challengesAvailable[rnd_index];
      if (challenge) {
        const challengeData: ChallengeData = {
          serverId: this.server._worldId,
          type: challenge.type,
          date: new Date(),
          status: ChallengeStatus.CURRENT,
          playerGuid: client.loginSessionId,
          points: 0
        };

        await this.challengesCollection.insertOne(challengeData);
        client.character.currentChallenge = challenge.type;
      } else {
        client.character.currentChallenge = ChallengeType.NONE;
      }
    } else {
      client.character.currentChallenge = ChallengeType.NONE;
    }

    this.displayChallengeInfos(client);
  }
}
