import { LoginClient, LoginServer } from "../../h1z1-server";


const cryptoKey = Buffer.from("F70IaxuU8C/w7FPXY1ibXw==", "base64");
const numberOfClient = 10;

    


    (async function benchFullLogin(){
        const loginServer = new LoginServer(1115);
        loginServer.deleteAllLocalCharacters();
        await loginServer.start()
        for (let index = 0; index < numberOfClient; index++) {
        
            const client = new LoginClient(
                295110,
                "dev",
                "127.0.0.1",
                1115,
                cryptoKey, // <- loginkey
                4851 + index
            );
            setTimeout(() => {
                console.time(`Client#${index}-fullLogin`)
                client.connect();
            }, 2000);
            client.on("login", (err, res) => {
                if (res.loggedIn) {
                client.requestServerList();
                }
            });
            client.on("serverlist", (err, res) => {
                client.requestCharacterInfo();
            });
            client.on("charactercreate", (err, res) => {
                client.requestCharacterLogin(res.characterId, 1, {
                    locale: "EnUS",
                    localeId: 1,
                    preferredGatewayId: 8,
                });
            });
            client.on("characterinfo", (err, res) => {
                client.requestCharacterCreate();
            });
            client.on("characterlogin", (err, res) => {
                console.timeEnd(`Client#${index}-fullLogin`)
            });
        }
    })()
    