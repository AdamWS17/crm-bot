import { ColorResolvable, Colors, CommandInteraction, EmbedBuilder, GuildMember, TimestampStyles } from 'discord.js';
import { client } from '../../index.js';
import { WarningRecord } from '../../models/Warn.js';
import { WarmEmbedColor } from './types.js';

/**
 *
 * @param warns
 * @param start
 * @returns
 */
export function viewWarningMessageRender(warns: WarningRecord[], start:number = 0) {
    const embeds: EmbedBuilder[] = [];
    const numberOfWarns = warns.length;

    for (let index = start; index < start + 3 && index < numberOfWarns; index++) {
        const record = warns[index];
		const embed = warningEmbed(record, false, record.expireAt > new Date() ? WarmEmbedColor.Active : WarmEmbedColor.Inactive)
		if(!embed) continue;
        embeds.push(embed);
    }

    return embeds;
}

/**
 *
 * @param warn
 * @param timeUpdated
 * @param embedColor
 * @returns
 */
export function warningEmbed(warn: WarningRecord, timeUpdated:boolean = false, embedColor: ColorResolvable = WarmEmbedColor.Issued) {
	const guild = client.guilds.cache.get(warn.guildId)
	if (!guild) return
	const target = guild.members.cache.get(warn.targetDiscordId)
	const moderator = guild.members.cache.get(warn.moderatorDiscordId)
	if(!target || !moderator) return

	return new EmbedBuilder()
		.setTitle('Warn')
		.setDescription(`**Reason:** ${warn.reason}`)
		.addFields(
			{ name: 'Target', value: `${target}\n${target.user.username}`, inline: true },
			{ name: 'Moderator', value: `<${moderator}>\n${moderator.user.username}`, inline: true },
			{
				name: 'Expires',
				value: `${warn.expireAt.toDiscordString(TimestampStyles.RelativeTime)}:\n ${warn.expireAt.toDiscordString(TimestampStyles.LongDateTime)}>`,
				inline: true })

		.setColor(embedColor)
		.setThumbnail(target.avatarURL())
		.setFooter({ text: `ID: ${warn.id}` })
		.setTimestamp(timeUpdated ? warn.updatedAt : warn.createdAt);
}

/**
 *
 * @param record
 * @param remover
 * @param deleted
 * @returns
 */
export function removeWarnEmbed(record:WarningRecord, remover:GuildMember, deleted: boolean = false) {
	const guild = client.guilds.cache.get(record.guildId)
	if (!guild) return
	const target = guild.members.cache.get(record.targetDiscordId)
	const moderator = guild.members.cache.get(record.moderatorDiscordId)
	if(!target || !moderator) return

    const embed = new EmbedBuilder()
        .setTitle(`Warn | ${deleted ? 'Deleted' : 'Removed'}`)
        .setDescription(`**Reason for Warning:** ${record.reason}`)
        .addFields(
            { name: 'Target', value: `${target}\n${target.user.username}`, inline: true },
            { name: 'Moderator', value: `<${moderator}>\n${moderator.user.username}`, inline: true },
            { name: 'Removed By', value: `${remover}\n${remover.user.username}`, inline: true })
        .setTimestamp();

    if (deleted) {
        return embed.setColor(WarmEmbedColor.Inactive);
    }
    else {
        return embed.setColor(WarmEmbedColor.Active).setFooter({ text: `ID: ${record.id}` });
    }
}

/**
 *
 * @param record
 * @param numberOfWarns
 */
export function dmEmbed(record:WarningRecord, numberOfWarns:number) {
    const { reason, expireAt } = record;
	const guild = client.guilds.cache.get(record.guildId)
	if (!guild) return
    const embed = new EmbedBuilder()
        .setTitle('Warning')
        .setDescription(`**Reason:** ${reason}`)
        .setColor(WarmEmbedColor.Issued)
        .addFields(
            { name: 'Number of active warning(s)', value: `${numberOfWarns}` },
            { name: 'Time till warn expiration', value: expireAt.toDiscordString(TimestampStyles.RelativeTime) })
        .setAuthor({ name: guild.name, iconURL: guild.iconURL({ forceStatic: true })! })
        .setTimestamp(record.createdAt);
    return embed;
}
/**
 *
 * @param interaction
 * @param banReason
 * @param appealMessage
 * @returns
 */
export function banDmEmbed(interaction:CommandInteraction<"cached">, banReason:string, appealMessage?:string) {
	if(!interaction.inGuild()) {
		return
	}
    const embed = new EmbedBuilder()
        .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ forceStatic: true }) ?? undefined })
        .setTimestamp()
        .setTitle('Banned')
        .setDescription(banReason)
        .setColor(Colors.Red);
    if (appealMessage) embed.addFields({ name: 'Appeal Info', value: appealMessage });
    return embed;
}

