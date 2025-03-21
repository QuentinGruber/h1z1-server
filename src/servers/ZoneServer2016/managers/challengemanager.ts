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
  NONE = 0,
  WOOD = 1,
  ZOMBIE = 2,
  PLAYERS = 3,
  BLACKBERRIES = 4
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
  // TODO: add to config
  challengesPerDay: number = 3;
  // managed by config
  enabled: boolean = true;
  constructor(public server: ZoneServer2016) {
    this.challenges = [
      {
        type: ChallengeType.WOOD,
        difficulty: ChallengeDifficulty.EASY,
        name: "wood",
        description: "Cut 2 trees",
        neededPoints: 2,
        pvpOnly: false
      },
      {
        type: ChallengeType.ZOMBIE,
        difficulty: ChallengeDifficulty.EASY,
        name: "zombie",
        description: "Kill 10 zombies",
        neededPoints: 10,
        pvpOnly: false
      },
      // {
      //   type: ChallengeType.PLAYERS,
      //   difficulty: ChallengeDifficulty.EASY,
      //   name: "players",
      //   description: "Kill 2 players",
      //   neededPoints: 2,
      //   pvpOnly:true
      // },
      {
        type: ChallengeType.BLACKBERRIES,
        difficulty: ChallengeDifficulty.EASY,
        name: "blackberries",
        description: "Harvest 3 blackberries",
        neededPoints: 3,
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
      message = `Challenge "${cInfos.name}": ${cInfos.description} \n Progression: ${challengeData?.points}/${cInfos.neededPoints}`;
    } else {
      message = `No more challenges for today. (${this.challengesPerDay / this.challengesPerDay})`;
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
    const query = {
      status: ChallengeStatus.CURRENT,
      serverId: this.server._worldId,
      playerGuid: client.loginSessionId
    };
    await this.challengesCollection.updateOne(query, {
      $set: { status: ChallengeStatus.DONE }
    });
    this.affectChallenge(client);
  }

  async affectChallenge(client: ZoneClient2016) {
    const today = new Date();
    const timeZoneOffset = today.getTimezoneOffset() * 60000; // Convert minutes to milliseconds
    const now = Date.now();

    const startOfDay = new Date(now - timeZoneOffset);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now - timeZoneOffset);
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
    const challengesAvailable = this.challenges.filter((v) => {
      return (
        (!challengesTypesDoneToday.includes(v.type) && !v.pvpOnly) ||
        !this.server.isPvE
      );
    });
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

    this.displayChallengeInfos(client);
  }
}
