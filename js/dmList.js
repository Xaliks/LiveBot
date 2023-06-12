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

function mutualGuilds(u, g, remove) {
	if (u.bot) return;
	if (!u.mutualGuilds) {
		u.mutualGuilds = new Discord.Collection();
		bot.guilds.cache.each((g) => {
			if (!g.available) return;
			let inGuild = g.members.cache.get(u.id);
			if (inGuild && !u.mutualGuilds.get(u.id)) u.mutualGuilds.set(g.id, g);
			else if (!inGuild && u.mutualGuilds.get(u.id)) u.mutualGuilds.delete(g.id);
		});
		return;
	}

	let mutualGuild = u.mutualGuilds.get(g.id);

	if (remove && mutualGuild) u.mutualGuilds.delete(g.id);
	else if (!remove && !mutualGuild) u.mutualGuilds.set(g.id, g);
}

function updateUsers(bunch, m = undefined, remove = false) {
	if (bunch || !m) {
		bot.users.cache.each((u) => {
			u.openDM !== true && u.openDM !== false ? (u.openDM = false) : undefined;
			u.mutualGuilds ? undefined : mutualGuilds(u);
			!!u.received;
		});
		return;
	}

	if (m.user.openDM === undefined) m.user.openDM = false;

	if (m) mutualGuilds(m.user, m.guild, remove);
}

function dmList() {
	console.log("Switching to dms");

	const channelList = document.getElementById("channel-elements");
	const lastSelectedChannel = settings.lastDM;

	// If a guild is selected then hide the guild indicator
	document.getElementById("guildIndicator").style.display = "none";
	selectedGuild = undefined;

	// Clear guild card
	let children = document.getElementById("serverName").children;
	children[0].innerText = "Direct Messages"; // Server name element

	// Toggle on the directMsg class for css
	if (!Array.from(children[0].classList).includes("directMsg")) children[0].classList.add("directMsg");

	children[1].src = "resources/icons/logo.svg"; // Server icon element
	children[2].style.display = "none"; // Member text element
	children[3].innerText = ""; // Member count element

	// Delete the selected chan variables
	selectedChan = undefined;

	// Clear all the channels to make space for the users
	channelList.replaceChildren();
	document.getElementById("memberBar").replaceChildren();
	document.getElementById("message-list").replaceChildren();
	document.getElementById("typingIndicator").replaceChildren();
	document.getElementById("typingDots").classList.remove("enabled");

	settings.dms
		.sort((userDM1, userDM2) => userDM2.lastMessage - userDM1.lastMessage)
		.forEach(async (userDM) => {
			const user = await bot.users.fetch(userDM.id);
			if (!user || user.bot || user.system || user.id === bot.user.id) return;

			const channelContainer = document.createElement("li");
			channelList.appendChild(channelContainer);
			channelContainer.classList.add("dmChannelContainer");
			channelContainer.id = user.id;

			const channelWrapper = document.createElement("div");
			channelContainer.appendChild(channelWrapper);
			channelWrapper.classList.add("dmChannelWrapper");

			const channelContent = document.createElement("div");
			channelWrapper.appendChild(channelContent);
			channelContent.classList.add("dmChannelContent");

			const userAvatarElement = document.createElement("img");
			channelContent.appendChild(userAvatarElement);
			userAvatarElement.classList.add("dmUserAvatar");

			userAvatarElement.src = user.displayAvatarURL({ size: 64, forceStatic: true });
			channelContainer.onmouseenter = (e) => {
				userAvatarElement.src = user.displayAvatarURL({ size: 64 });
			};
			channelContainer.onmouseleave = (e) => {
				userAvatarElement.src = user.displayAvatarURL({ size: 64, forceStatic: true });
			};

			const nicknameElement = document.createElement("div");
			channelContent.appendChild(nicknameElement);
			nicknameElement.classList.add("userUsername");
			nicknameElement.innerText = user.username;

			const closeButtonElement = new DOMParser().parseFromString(
				fs.readFileSync("./resources/icons/channels/dmCloseButton.svg", "utf8"),
				"text/html",
			).body.firstElementChild;
			channelContent.appendChild(closeButtonElement);
			closeButtonElement.classList.add("dmChannelButton");

			if (user.id === lastSelectedChannel) {
				channelWrapper.dataset.selected = "true";

				channelSelect(await user.createDM());
			}

			let deleted = false;
			// On click the close button
			closeButtonElement.addEventListener("click", () => {
				deleted = true;

				// Remove the channel
				channelContainer.remove();

				// Remove from dms list
				settings.dms = settings.dms.filter(({ id }) => id !== user.id);

				if (user.id !== selectedChan?.recipientId) return;

				settings.lastDM = null;

				dmList();
			});

			// Create click event
			channelWrapper.addEventListener("click", async () => {
				if (deleted || user.id === selectedChan?.recipientId) return;

				// Remove all selected attributes
				document
					// eslint-disable-next-line quotes
					.querySelectorAll('[data-selected="true"]')
					.forEach((element) => element.removeAttribute("data-selected"));

				settings.lastDM = user.id;

				channelWrapper.dataset.selected = "true";
				channelSelect(await user.createDM());
			});
		});
}
