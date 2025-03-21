import { ActionRowBuilder, ButtonBuilder, ButtonInteraction } from 'discord.js';
import { FilterQuery } from 'mongoose';
import { Interaction } from '../../Classes/index.js';
import { warnButtons } from '../../features/moderation/buttons.js';
import { isRightArrowDisabled } from '../../features/moderation/index.js';
import { viewWarningMessageRender } from '../../features/moderation/warningRender.js';
import { Warn, WarningRecord } from '../../models/Warn.js';
import { WarningSearch } from '../../models/WarnSearch.js';

export const warnViewLeft = new Interaction<ButtonInteraction>({
	customIdPrefix:'wvl',
	run: async (interaction: ButtonInteraction) => {

		const {customId, client} = interaction

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_id, searchId] = customId.split(client.splitCustomIdOn!)
		
		interaction.deferUpdate()

		const searchRecord = await WarningSearch.findById(searchId);

		if(!searchRecord) {
			throw Error(`Unknown searchRecord Id: ${searchId}`)
		}

		const {expireAfter, moderatorDiscordId, targetDiscordId, pageStart} = searchRecord
		const filter: FilterQuery<WarningRecord> = {}

		if (moderatorDiscordId) filter.moderatorDiscordId = moderatorDiscordId
		if (targetDiscordId) filter.targetDiscordId = targetDiscordId
		if (expireAfter) filter.expireAt = { $gte: expireAfter }
		
		searchRecord.pageStart -= 3
		searchRecord.save();
		
		const records = await Warn.find(filter)

		const actionRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				warnButtons.leftButton(searchRecord),
				warnButtons.rightButton(searchRecord, isRightArrowDisabled(pageStart, records.length))
			)

		interaction.update({
			embeds: viewWarningMessageRender(records, pageStart),
			components:[actionRow]
		})
	}
});

export const warnViewRight = new Interaction<ButtonInteraction>({
	customIdPrefix:'wvr',
	run: async (interaction: ButtonInteraction) => {

		const {customId, client} = interaction

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_id, searchId] = customId.split(client.splitCustomIdOn!)
		
		interaction.deferUpdate()

		const searchRecord = await WarningSearch.findById(searchId);

		if(!searchRecord) {
			throw Error(`Unknown searchRecord Id: ${searchId}`)
		}

		const {expireAfter, moderatorDiscordId, targetDiscordId, pageStart} = searchRecord
		const filter: FilterQuery<WarningRecord> = {}

		if (moderatorDiscordId) filter.moderatorDiscordId = moderatorDiscordId
		if (targetDiscordId) filter.targetDiscordId = targetDiscordId
		if (expireAfter) filter.expireAt = { $gte: expireAfter }
		
		searchRecord.pageStart += 3
		searchRecord.save();
		
		const records = await Warn.find(filter)

		const actionRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(
				warnButtons.leftButton(searchRecord),
				warnButtons.rightButton(searchRecord, isRightArrowDisabled(pageStart, records.length))
			)

		interaction.update({
			embeds: viewWarningMessageRender(records, pageStart),
			components:[actionRow]
		})

	}
});
