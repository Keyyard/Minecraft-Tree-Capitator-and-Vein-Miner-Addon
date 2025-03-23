import { PaletteColor, Player, system } from "@minecraft/server";

export function onFirstJoin(player: Player) {
  const messages = [
    "<Keyyard> Hey there! You have successfully applied Tree Capitator and Vein Miner addon to your world.",
    "<Keyyard> To use Tree Capitator, hold an axe and break the bottom block of a tree while sneaking.",
    "<Keyyard> To use Vein Miner, hold a pickaxe and break a block while sneaking.",
    `<Keyyard> You can use the "Option Controller" item to activate or deactivate these features.`,
    "<Keyyard> There will be more features coming soon!",
    "<Keyyard> Follow us on \xA7cYou\xA7fTube\xA7r Keyyard, \xA7bTwitter\xA7r @Keyyard, \xA7cYou\xA7fTube\xA7r Beyond64",
    "<Keyyard> Join our community discord server: \xA7bhttps://discord.gg/s2VfQr69uz , \xA7bhttps://discord.gg/cdZA3bccQk",
    "<Keyyard> Have fun playing!",
  ];

  const hasJoined = player.hasTag("joined");
  
  const messagesToSend = hasJoined ? messages.slice(-3) : messages;

  messagesToSend.forEach((message, index) => {
    system.runTimeout(() => {
      player.sendMessage(message);
      player.dimension.playSound("random.orb", player.location);
    }, 100 + index * 150);
  });

  if (!hasJoined) {
    player.addTag("joined");
  }
}
