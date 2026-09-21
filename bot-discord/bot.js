const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pcyaeeyxtscyibdzanwx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWFlZXl4dHNjeWliZHphbnd4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTczOTMwNSwiZXhwIjoyMTA1MzE1MzA1fQ.64O6BkKxRdDW3zz-usPhrCMc98CdeGrkN7522lafp0Q';
const DISCORD_TOKEN = 'MTU1MTI0MDc2MjQ5Mjk3NzI1Mw.GRCCuQ.VPVJuCoUdMPyjlwc-39GQCCrowcmotUoS1J9do';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.once('clientReady', () => {
    console.log(`🚀 Nezuko Verifier Bot is Online! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (!message.channel.name.toLowerCase().startsWith('ticket-')) return;

    const content = message.content.toLowerCase();

    if (content.includes('# verifikasi client nezuko')) {
        const lines = message.content.split('\n');
        let rawDeviceId = "";

        for (const line of lines) {
            if (line.toLowerCase().includes('device_id')) {
                rawDeviceId = line.replace(/device_id\s*[:\s-]*/i, '')
                                  .replace(/[\[\]\(\)\s]/g, '');
                break;
            }
        }

        if (!rawDeviceId || rawDeviceId.length < 10) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(0xFFA500)
                        .setTitle("❌ Format Salah")
                        .setDescription("Pastikan kamu menuliskan Device ID dengan benar.\n\nContoh:\n```text\n# Verifikasi Client Nezuko\nDevice_id: [SALIN_ID_DARI_CLIENT]\n```")
                ]
            });
        }

        const deviceId = rawDeviceId.toLowerCase();

        try {
            const { data: userExists } = await supabase
                .from('whitelist')
                .select('device_id')
                .eq('discord_id', message.author.id)
                .single();

            if (userExists) {
                return message.reply(`❌ **Gagal!** Kamu sudah terdaftar dengan ID: \`${userExists.device_id}\``);
            }

            const { error } = await supabase
                .from('whitelist')
                .insert([{
                    device_id: deviceId,
                    discord_id: message.author.id,
                    discord_tag: message.author.tag,
                    is_active: true
                }]);

            if (error) {
                if (error.code === '23505') return message.reply("❌ **Gagal!** Device ID sudah dipakai orang lain.");
                return message.reply("❌ **Database Error!** Gagal menyimpan data, hubungi Admin.");
            }

            const successEmbed = new EmbedBuilder()
                .setColor(0x00FF00)
                .setTitle('✅ Verifikasi Berhasil')
                .setDescription(`Halo **${message.author.username}**, perangkat kamu berhasil diverifikasi!\n\n**Kamu bisa main sekarang!** 🚀.*`)
                .addFields(
                    { name: 'Device ID', value: `\`${deviceId}\``, inline: true },
                    { name: 'User', value: `<@${message.author.id}>`, inline: true }
                )
                .setThumbnail(message.author.displayAvatarURL())
                .setFooter({ text: 'Nezuko SA-MP Project' })
                .setTimestamp();

            await message.reply({ embeds: [successEmbed] });

            console.log(`⏳ Menjadwalkan penghapusan channel ${message.channel.name} dalam 60 detik.`);

            setTimeout(async () => {
                try {
                    await message.channel.send("👋 Waktu verifikasi selesai, menghapus ticket ini...");
                    setTimeout(() => {
                        message.channel.delete().catch(e => console.error("Gagal hapus channel:", e));
                    }, 3000);
                } catch (err) {
                    console.error("Gagal mengirim pesan penutup:", err);
                }
            }, 60000);

        } catch (err) {
            console.error(err);
            message.reply("❌ Terjadi kesalahan pada sistem verifikasi.");
        }
    }
});

client.login(DISCORD_TOKEN);
