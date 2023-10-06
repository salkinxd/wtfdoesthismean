import axios from "axios";
import { Client, Events, GatewayIntentBits, REST, Routes } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, (c) => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

interface dictResponse {
    definition: string;
    permalink: string;
    thumbs_up: number;
    author: string;
    word: string;
    defid: number;
    current_vote: string;
    written_on: string;
    example: string;
    thumbs_down: number;
}

var TOKEN: string = process.env.TOKEN!;

const rest = new REST({ version: "10" }).setToken(TOKEN);

const commands = [
    {
        name: "urban",
        description: "Urban Dictionary Lookup",
        default_member_permissions: "0",
        options: [
            {
                type: 3,
                name: "word",
                description: "Definition to look up",
                required: true,
            },
            {
                type: 4,
                name: "amount",
                description: "Top x definitions to lookup",
                required: false,
            },
        ],
    },
];
async function test() {
    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationCommands(process.env.CLIENTID!), {
            body: commands,
        });

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }
}

test();

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    let commandOptions = interaction.options.data;
    let word = commandOptions.find((option) => option.name === "word")!;
    let amount = commandOptions.find((option) => option.name === "amount")!;
    if (interaction.options) {
        if (typeof word.value === "string" && word.value && word.value != "") {
            if (amount) {
                if (typeof amount.value === "number") {
                    if (interaction.commandName === "urban") {
                        await interaction.reply(
                            await getDict(word.value, amount.value)
                        );
                    }
                }
            } else {
                if (interaction.commandName === "urban") {
                    const text: string = await getDict(word.value, 0);
                    await interaction.reply(text);
                    console.log(text);
                }
            }
        }
    }
});

async function getDict(input: string, amount: number): Promise<string> {
    const options = {
        method: "GET",
        url: "https://mashape-community-urban-dictionary.p.rapidapi.com/define",
        params: { term: input },
        headers: {
            "X-RapidAPI-Key":
                "17af403273mshc15b87d0c5dc0b9p1eda87jsnb300765e1ff8",
            "X-RapidAPI-Host":
                "mashape-community-urban-dictionary.p.rapidapi.com",
        },
    };

    try {
        const response = await axios.request(options);
        let responses: dictResponse[] = response.data.list;
        if (responses.length < 1) {
            return "No entries found!";
        }
        response.data.list.sort((a: dictResponse, b: dictResponse) => {
            return b.thumbs_up - b.thumbs_down - (a.thumbs_up - a.thumbs_down);
        });

        if (amount <= 1) {
            return `The **number one** definition of \"*${input}*\" is:\`\`\`\n${
                responses[0].definition
            }\n\`\`\`[(${1}) Rating: ${
                responses[0].thumbs_up - responses[0].thumbs_down
            }\n](https://www.urbandictionary.com/define.php?term=${encodeURIComponent(
                responses[0].word
            )}&defid=${responses[0].defid})`;
        } else {
            let responseString: string = `The **top ${amount}** definitions of \"*${input}*\" are:`;

            responses.slice(0, amount).forEach((element, index) => {
                responseString += `\`\`\`\n${element.definition}\n\`\`\`[(${
                    index + 1
                }) Rating: ${
                    element.thumbs_up - element.thumbs_down
                }\n](https://www.urbandictionary.com/define.php?term=${encodeURIComponent(
                    element.word
                )}&defid=${element.defid})`;
            });

            if (responseString.length >= 2000) {
                console.error("Too many definitions: " + responseString.length);
                return (
                    "Error: Too many Definitions - *Message would be too large: " +
                    responseString.length +
                    " Characters (out of 2000 Characters)*"
                );
            }

            return responseString + "\n";
        }
    } catch (error) {
        return "Error";
    }
}

client.login(TOKEN);
