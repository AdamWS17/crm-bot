import { ActionRowBuilder, ButtonBuilder, GuildMember, MessageFlags, ModalBuilder, ModalSubmitInteraction, TextInputBuilder, TextInputStyle } from 'discord.js';
import { Interaction } from '../../Classes/index.js';
import { updateIssueButton, viewUserWarns } from '../../features/moderation/buttons.js';
import { dmEmbed, warningEmbed } from '../../features/moderation/WarnEmbed.js';
import { setDate, Warn, WarningRecord } from '../../models/Warn.js';
import { isGuildMember } from '../../util/index.js';

/**
 * Create Modal for creating or updated warn
 * @param customId
 * @param title
 * @param reason
 * @param day
 * @returns
 */
export function warnModal(customId:string, title: string, reason?:string, day?: number) {

	const reasonInput = new TextInputBuilder()
		.setCustomId('reason')
		.setLabel('Reason for issuing this warning')
		.setStyle(TextInputStyle.Paragraph)
		.setRequired(true)
	
	const durationInput = new TextInputBuilder()
		.setCustomId('duration')
		.setLabel('Number of days till warning expires')
		.setPlaceholder('90')
		.setMinLength(1)
		.setMaxLength(3)
		.setStyle(TextInputStyle.Short)
		.setRequired(false)

	if(reason)
		reasonInput.setValue(reason)

	if(day)
		durationInput.setValue(day.toString())

	const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
		.addComponents(reasonInput)
	const secondActionRow = new ActionRowBuilder<TextInputBuilder>()
		.addComponents(durationInput)

	const modal = new ModalBuilder()
		.setTitle(title)
		.setCustomId(customId)
		.addComponents(firstActionRow,secondActionRow)

	return modal
}



export const warnCreate = new Interaction<ModalSubmitInteraction>({
	customIdPrefix:'warn',
	run: async (interaction: ModalSubmitInteraction) => {

		const {customId, client, guild, member, fields} = interaction
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_id, action, targetId] = customId.split(client.splitCustomIdOn!)
		
		if(action == 'create') {
			const numberRegex:RegExp = /^\d{1,3}$/is
			const target = guild?.members.cache.get(targetId);
			const mod = member;
			if( !(target && isGuildMember(mod))) return

			const reason = fields.getTextInputValue('reason')
			const modalDuration = fields.getTextInputValue('duration');
			let duration: number | undefined
			if(!numberRegex.test(modalDuration)) {
				duration = undefined
			} else {
				duration = Number(modalDuration)
			}
			
			const record = await Warn.createWarning(target,mod,reason, duration)

			target.send({
				embeds: [dmEmbed(record, guild!)]
			})
			interaction.reply({
				flags: MessageFlags.Ephemeral,
				embeds:[(await warningEmbed(record))!.setTitle('Warning Issued')],
				components:[WarnCreateActionRow(record, target)]
			})
		}
		
	}
});

export const warnUpdated = new Interaction<ModalSubmitInteraction>({
	customIdPrefix:'wu',

	run: async (interaction: ModalSubmitInteraction) => {

		 
		const {customId, client, guild} = interaction
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const [_id, warnId] = customId.split(client.splitCustomIdOn!)
		const record = await Warn.findById(warnId)
		if (!record) return
		
		const numberRegex:RegExp = /^\d{1,3}$/is
		const target = guild?.members.cache.get(record.target.discordId) ?? await guild?.members.fetch(record.target.discordId);
		const mod = guild?.members.cache.get(record.moderator.discordId) ?? await guild?.members.fetch(record.moderator.discordId);

		if( !target || !mod) return

		const reason = interaction.fields.getTextInputValue('reason')

		record.reason = reason

		const modalDuration = interaction.fields.getTextInputValue('duration');
		let duration: number | undefined
		if(numberRegex.test(modalDuration)) {
			duration = Number(modalDuration)
			record.expireAt = setDate(duration)
		}
		record.updater = {
			discordId:interaction.user.id, 
			username:interaction.user.username
		}
		record.updatedAt = new Date()
		record.save()

		interaction.reply({
			flags: MessageFlags.Ephemeral,
			embeds:[(await warningEmbed(record))!.setTitle('Warning Updated')],
			components:[WarnCreateActionRow(record, target)]
		})
	}
});

/**
 *
 * @param record
 * @param target
 * @returns
 */
function WarnCreateActionRow(record:WarningRecord, target: GuildMember) {
	const actionRow = new ActionRowBuilder<ButtonBuilder>()
	.addComponents(
		updateIssueButton(record),
		viewUserWarns(target.id)
	)
	return actionRow
}
