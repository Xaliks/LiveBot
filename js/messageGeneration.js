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

function generateMsgHTML(message, previousMessage) {
	const messageList = document.getElementById("message-list");
	let messagesContainer;

	// Create message container
	let messageContainer = document.createElement("div");
	messageContainer.classList.add("messageBlock");
	messageContainer.id = message.id;

	// Check if message needs to be separated from previous message
	if (
		message.author.id !== previousMessage?.author.id ||
		message.createdTimestamp - previousMessage.createdTimestamp >= 7 * 60_000
	) {
		messageContainer.classList.add("firstmsg");

		// Create author's messages container
		messagesContainer = document.createElement("div");
		messagesContainer.classList.add("messageCont");
		messagesContainer.id = message.author.id;
		if (message.channel.type === Discord.ChannelType.DM) messagesContainer.classList.add("dms");
		messageList.appendChild(messagesContainer);

		// Create user's avatar
		let img = document.createElement("img");
		img.classList.add("messageImg");
		img.height = "40";
		img.width = "40";
		img.src = (message.member || message.author).displayAvatarURL({
			size: 64,
			forceStatic: true,
		});
		messagesContainer.onmouseenter = (e) => {
			img.src = (message.member || message.author).displayAvatarURL({
				size: 64,
			});
		};
		messagesContainer.onmouseleave = (e) => {
			img.src = (message.member || message.author).displayAvatarURL({
				size: 64,
				forceStatic: true,
			});
		};
		messageContainer.appendChild(img);

		// Create user's nickname
		let name = document.createElement("p");
		name.innerText = message.member?.nickname || message.author.username;
		name.classList.add("messageUsername");

		// Use the highest role for nickname color
		name.style.color = message.member?.roles.color?.hexColor || "#fff";

		messageContainer.appendChild(name);

		// Create timestamp
		let timestamp = document.createElement("p");
		timestamp.classList.add("messageTimestamp");
		let yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);
		// Check if message is created today
		if (new Date().toDateString() === message.createdAt.toDateString()) {
			timestamp.innerText = ` Today at ${message.createdAt.toLocaleString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			})}`;
		}
		// Check if message is created yesterday
		else if (yesterday.toDateString() === message.createdAt.toDateString()) {
			timestamp.innerText = ` Yesterday at ${message.createdAt.toLocaleString("en-US", {
				hour: "2-digit",
				minute: "2-digit",
			})}`;
		} else {
			timestamp.innerText = ` ${message.createdAt.toLocaleString("en-US", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			})}`;
		}
		messageContainer.appendChild(timestamp);
	}
	messagesContainer = [...messageList.querySelectorAll(`[id='${message.author.id}']`)].at(-1);

	messagesContainer.appendChild(messageContainer);

	if (message.cleanContent.length) {
		// Render message text
		let text = document.createElement("p");
		text.classList.add("messageText");
		text.innerHTML = parseMessage(message.cleanContent, message, false);

		if (message.editedAt) {
			// eslint-disable-next-line quotes
			text.innerHTML += '<time class="edited"> (edited)</time>';
		}

		messageContainer.appendChild(text);
	}

	// Show embeds
	message.embeds.forEach((embed) => {
		showEmbed(embed.data, messageContainer, message);
	});

	return messagesContainer;
}
