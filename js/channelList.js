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

function createChannels(guild) {
	const channelList = document.getElementById("channel-elements");

	// Clear the channels list
	channelList.replaceChildren();

	const currentSelectedChannelId = settings.lastChannels[guild.id];

	const categories = new Discord.Collection();
	categories.set("noCategory", { id: "noCategory", channels: [] });

	guild.channels.cache
		// Threads are currently not supported
		.filter((channel) => !Discord.Constants.ThreadChannelTypes.includes(channel.type))
		// Filter categories
		.filter((channel) => channel.type !== Discord.ChannelType.GuildCategory)
		// Put voice channels after text channels
		.map((channel) => {
			if (Discord.Constants.VoiceBasedChannelTypes.includes(channel.type)) {
				channel.rawPosition += guild.channels.cache.size;
			}
			return channel;
		})
		// Sort channels by position
		.sort((channel1, channel2) => channel1.rawPosition - channel2.rawPosition)
		.forEach((channel) => {
			const category = categories.get(channel.parentId || "noCategory") || {
				id: channel.parentId || "noCategory",
				name: channel.parent?.name,
				channels: [],
			};

			category.channels.push(channel);
			categories.set(category.id, category);
		});

	categories.forEach((category) => {
		if (!category.channels.length) return;

		const categoryContainer = document.createElement("li");
		channelList.appendChild(categoryContainer);
		categoryContainer.classList.add("categoryContainer");

		// If channels has category
		if (category.id !== "noCategory") {
			categoryContainer.id = category.id;

			const categoryWrapper = document.createElement("div");
			categoryContainer.appendChild(categoryWrapper);
			categoryWrapper.classList.add("categoryWrapper");

			const categoryContent = document.createElement("div");
			categoryWrapper.appendChild(categoryContent);
			categoryContent.classList.add("categoryContent");

			// Create the category arrow
			const categoryArrowElement = new DOMParser().parseFromString(
				fs.readFileSync("./resources/icons/channels/categoryArrow.svg", "utf8"),
				"text/html",
			).body.firstElementChild;
			categoryContent.appendChild(categoryArrowElement);
			categoryArrowElement.classList.add("categoryArrow");

			// Create the category name
			const categoryNameElement = document.createElement("div");
			categoryContent.appendChild(categoryNameElement);
			categoryNameElement.classList.add("categoryName");
			categoryNameElement.innerText = category.name;

			// Event listener for opening and closing
			categoryWrapper.addEventListener("click", () => {
				categoryArrowElement.classList.toggle("collapsed");
			});
		}

		category.channels.forEach((channel) => {
			const channelContainer = document.createElement("li");
			channelList.appendChild(channelContainer);
			channelContainer.classList.add("channelContainer");
			channelContainer.id = channel.id;

			const channelWrapper = document.createElement("div");
			channelContainer.appendChild(channelWrapper);
			channelWrapper.classList.add("channelWrapper");

			const channelContent = document.createElement("div");
			channelWrapper.appendChild(channelContent);
			channelContent.classList.add("channelContent");

			// Create the channel icon
			const channelIconElement = new DOMParser().parseFromString(
				fs.readFileSync(`./resources/icons/channels/${channelIconName(channel)}.svg`, "utf8"),
				"text/html",
			).body.firstElementChild;
			channelContent.appendChild(channelIconElement);
			channelIconElement.classList.add("channelIcon");

			// Create the channel name
			const channelNameElement = document.createElement("div");
			channelContent.appendChild(channelNameElement);
			channelNameElement.classList.add("channelName");
			channelNameElement.innerText = channel.name;

			if (
				channel.permissionOverwrites.cache
					.get(bot.user.id)
					?.deny.has(Discord.PermissionFlagsBits.ViewChannel) ||
				(bot.hideUnallowed &&
					channel.permissionOverwrites.cache
						.get(bot.owner.id)
						?.deny.has(Discord.PermissionFlagsBits.ViewChannel))
			) {
				channelContainer.classList.add("channelBlocked");
			} else {
				// Create click event
				channelContainer.addEventListener("click", () => {
					if (channel.id !== currentSelectedChannelId) {
						// Remove all selected attributes
						document
							// eslint-disable-next-line quotes
							.querySelectorAll('[data-selected="true"]')
							.forEach((element) => element.removeAttribute("data-selected"));

						settings.lastChannels = { [guild.id]: channel.id };

						channelContainer.dataset.selected = "true";
						channelSelect(channel);
					}
				});
			}
		});
	});

	// Open previous selected channel
	const selectedChannelDiv = document.getElementById(currentSelectedChannelId);
	if (selectedChannelDiv && !selectedChannelDiv.classList.contains("channelBlocked")) {
		selectedChannelDiv.dataset.selected = "true";

		channelSelect(guild.channels.cache.get(currentSelectedChannelId));
	} else settings.lastChannels[guild.id] = null;
}

function channelIconName(channel) {
	let iconName = Discord.ChannelType[channel.type];

	if (channel.nsfw) iconName += "NSFW";
	else if (
		channel.permissionOverwrites.cache
			.get(channel.guild.id)
			?.deny?.has(Discord.PermissionFlagsBits.ViewChannel)
	) {
		iconName += "Blocked";
	}
	if (channel.threads?.cache.size) iconName += "Threads";

	switch (iconName) {
		// Forums
		case "GuildForum":
		case "GuildForumThreads":
			iconName = "GuildForum";
			break;
		case "GuildForumBlocked":
		case "GuildForumBlockedThreads":
			iconName = "GuildForumBlocked";
			break;
		// Announcements
		case "GuildNews":
			iconName = "GuildNews";
			break;
		case "GuildNewsBlocked":
			iconName = "GuildNewsBlocked";
			break;
		case "GuildNewsThreads":
			iconName = "GuildNewsThreads";
			break;
		case "GuildNewsNSFW":
			iconName = "GuildNewsNSFW";
			break;
		case "GuildNewsNSFWThreads":
			iconName = "GuildNewsNSFWThreads";
			break;
		// Stages
		case "GuildStageVoice":
		case "GuildStageVoiceNSFW":
			iconName = "GuildStageVoice";
			break;
		case "GuildStageVoiceBlocked":
			iconName = "GuildStageVoiceBlocked";
			break;
		// Texts
		case "GuildText":
			iconName = "GuildText";
			break;
		case "GuildTextBlocked":
			iconName = "GuildTextBlocked";
			break;
		case "GuildTextThreads":
			iconName = "GuildTextThreads";
			break;
		case "GuildTextNSFW":
			iconName = "GuildTextNSFW";
			break;
		case "GuildTextNSFWThreads":
			iconName = "GuildTextNSFWThreads";
			break;
		// Voices
		case "GuildVoice":
		case "GuildVoiceNSFW":
			iconName = "GuildVoice";
			break;
		case "GuildVoiceBlocked":
			iconName = "GuildVoiceBlocked";
			break;

		default:
			break;
	}

	if (channel.guild.rulesChannelId === channel.id) iconName = "Rules";
	if (
		Discord.Constants.VoiceBasedChannelTypes.includes(channel.type) &&
		channel.permissionOverwrites.cache.get(bot.user.id)?.deny.has(Discord.PermissionFlagsBits.Connect)
	) {
		iconName = "VoiceLocked";
	}

	return iconName;
}
