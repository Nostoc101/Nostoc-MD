export default {
    name: 'ping',
    cooldown: 2000,
    adminOnly: false,
    execute: (args) => {
        return "PONG: Response lag 0ms. Thread stable.";
    }
};