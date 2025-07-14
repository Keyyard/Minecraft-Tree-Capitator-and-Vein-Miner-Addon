import { PaletteColor, Player, system } from "@minecraft/server";

// Message templates for different scenarios
class MessageTemplates {
  static readonly FIRST_JOIN_MESSAGES = [
    "<Keyyard> Hey there! You have successfully applied Tree Capitator and Vein Miner addon to your world.",
    "<Keyyard> To use Tree Capitator, hold an axe and break the bottom block of a tree while sneaking.",
    "<Keyyard> To use Vein Miner, hold a pickaxe and break a block while sneaking.",
    `<Keyyard> You can use the "Option Controller" item to activate or deactivate these features.`,
    "<Keyyard> There will be more features coming soon!",
    "<Keyyard> Follow us on \n\xA7cYou\xA7fTube\xA7r Keyyard\n\xA7bTwitter\xA7r @Keyyard\n\xA7cYou\xA7fTube\xA7r Beyond64",
    "<Keyyard> Join our community discord server: \n\xA7bhttps://discord.gg/s2VfQr69uz\n\xA7bhttps://discord.gg/cdZA3bccQk",
    "<Keyyard> You can get the latest updates, report issues or suggest features on our GitHub repository: \n\xA7dhttps://github.com/Keyyard/Minecraft-Tree-Capitator-and-Vein-Miner-Addon",
    "<Keyyard> And a star on the repository would support us alot!",
    "<Keyyard> Have fun playing!",
  ];

  static readonly RETURNING_PLAYER_MESSAGES = [
    "<Keyyard> Follow us on \n\xA7cYou\xA7fTube\xA7r Keyyard\n\xA7bTwitter\xA7r @Keyyard\n\xA7cYou\xA7fTube\xA7r Beyond64",
    "<Keyyard> Join our community discord server: \n\xA7bhttps://discord.gg/s2VfQr69uz\n\xA7bhttps://discord.gg/cdZA3bccQk",
    "<Keyyard> You can get the latest updates, report issues or suggest features on our GitHub repository: \n\xA7dhttps://github.com/Keyyard/Minecraft-Tree-Capitator-and-Vein-Miner-Addon",
    "<Keyyard> And a star on the repository would support us alot!",
    "<Keyyard> Have fun playing!",
  ];
}

// Player state management
class PlayerStateManager {
  private static readonly FIRST_JOIN_TAG = "tcvm_first_joined";

  static isFirstTimePlayer(player: Player): boolean {
    return !player.hasTag(this.FIRST_JOIN_TAG);
  }

  static markAsJoined(player: Player): void {
    if (!player.hasTag(this.FIRST_JOIN_TAG)) {
      player.addTag(this.FIRST_JOIN_TAG);
    }
  }
}

// Notification system for delayed messages with sound effects
class NotificationSystem {
  private static readonly BASE_DELAY = 100;
  private static readonly MESSAGE_INTERVAL = 150;
  private static readonly NOTIFICATION_SOUND = "random.orb";

  static sendDelayedMessages(player: Player, messages: string[]): void {
    messages.forEach((message, index) => {
      const delay = this.BASE_DELAY + index * this.MESSAGE_INTERVAL;

      system.runTimeout(() => {
        this.sendNotificationWithSound(player, message);
      }, delay);
    });
  }

  private static sendNotificationWithSound(player: Player, message: string): void {
    player.sendMessage(message);
    player.dimension.playSound(this.NOTIFICATION_SOUND, player.location);
  }
}

// Main handler for player join events
class PlayerJoinHandler {
  static handlePlayerJoin(player: Player): void {
    const isFirstTime = PlayerStateManager.isFirstTimePlayer(player);

    if (isFirstTime) {
      this.handleFirstTimeJoin(player);
    } else {
      this.handleReturningPlayerJoin(player);
    }
  }

  private static handleFirstTimeJoin(player: Player): void {
    NotificationSystem.sendDelayedMessages(player, MessageTemplates.FIRST_JOIN_MESSAGES);
    PlayerStateManager.markAsJoined(player);
  }

  private static handleReturningPlayerJoin(player: Player): void {
    NotificationSystem.sendDelayedMessages(player, MessageTemplates.RETURNING_PLAYER_MESSAGES);
  }
}

// Public API - maintains backward compatibility
export function onFirstJoin(player: Player): void {
  PlayerJoinHandler.handlePlayerJoin(player);
}
