import { Player, system } from "@minecraft/server";

export function onFirstJoin(player: Player) {
  const messages = [
    "<Keyyard> Hey there! You have successfully applied Tree Capitator and Vein Miner addon to your world.",
    "<Keyyard> To use Tree Capitator, hold an axe and break the bottom block of a tree while sneaking.",
    "<Keyyard> To use Vein Miner, hold a pickaxe and break a block while sneaking.",
    "<Keyyard> There will be more features coming soon! follow me on \xA7cYou\xA7fTube\xA7r Keyyard, \xA7bTwitter\xA7r @Keyyard.",
    "<Keyyard> Join the community discord server: \xA7bhttps://discord.gg/s2VfQr69uz",
    "<Keyyard> Have fun playing!",
  ];

  messages.forEach((message, index) => {
    system.runTimeout(() => {
      player.sendMessage(message);
      player.dimension.playSound("random.orb", player.location);
    }, 100 + index * 150);
  });
}
