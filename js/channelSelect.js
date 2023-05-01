// Copyright 2017 Sebastian Ouellette

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

"use strict";

let channelSelect = (c, name) => {
	let messages = document.getElementById("message-list");
	let fetchSize = 100;

	if (!Discord.Constants.TextBasedChannelTypes.includes(c.type)) return (selectedVoice = c);

	selectedChan = c;

	if (name) {
		selectedChanDiv = name;
		name.style.color = "#eee";

		// Remove the notification class
		name.classList.remove("newMsg");

		// Set color of the channel
		selectedChanDiv.style.color = "#606266";
		name.addEventListener("mouseover", () => {
			if (name.style.color !== "rgb(238, 238, 238)") name.style.color = "#B4B8BC";
		});

		name.addEventListener("mouseleave", () => {
			if (name.style.color !== "rgb(238, 238, 238)") name.style.color = "#606266";
		});
	}

	// Clear the messages
	messages.replaceChildren();

	// Add new messages
	fetchMessages();

	// Refresh the typing indicator
	typingStatus(true);

	// Set the message bar placeholder
	document.getElementById("msgbox").placeholder = `Message #${c.recipient?.username || c.name}`;

	// Creates the loading dots
	let container = document.createElement("div"); // Centred container
	let loadingDots = document.createElement("div"); // Loading dots
	loadingDots.classList.add("dot-bricks");
	container.style.position = "absolute";
	container.style.top = "50%";
	container.style.left = "50%";
	container.style.transform = "translate(-50%, -50%)";
	container.id = "loading-container";
	container.appendChild(loadingDots);
	messages.appendChild(container);

	// Create the member list
	if (c.type !== Discord.ChannelType.DM) addMemberList(c.guild);

	// Create message
	async function fetchMessages() {
		// Loop through messages
		await c.messages.fetch({ limit: fetchSize }).then((messages) =>
			messages
				.toJSON()
				.reverse()
				.forEach((message, index, messages) => {
					let generatedHTML = generateMsgHTML(message, index ? messages.at(index - 1) : null);

					document.getElementById("message-list").appendChild(generatedHTML);
				}),
		);

		// Add the no load apology
		let shell = document.createElement("div");
		shell.classList.add("sorryNoLoad");
		let text = document.createElement("p");
		text.innerText = "Sorry! No messages beyond this point can be displayed.";
		shell.appendChild(text);
		document.getElementById("message-list").prepend(shell);

		messages.scrollTop = messages.scrollHeight;

		// Remove the loading dots
		messages.removeChild(document.getElementById("loading-container"));
	}
};

let dmChannelSelect = async (u) => {
	if (u.bot || bot.user === u) return;

	let c = u.dmChannel;
	if (!c) c = await u.createDM();

	if (!u.openDM) u.openDM = true;

	if (selectedChatDiv) {
		selectedChatDiv.classList.remove("selectedChan");
		selectedChatDiv = undefined;
	}

	channelSelect(c, selectedChatDiv);
};
