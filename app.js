const express = require("express");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const returnAllPlayersConversion = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const returnSpecificMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// 1 - Returns a list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
        SELECT * FROM 
        player_details
        ORDER BY player_id;
    `;
  const allPlayersArray = await db.all(getAllPlayersQuery);
  response.send(
    allPlayersArray.map((eachPlayer) => returnAllPlayersConversion(eachPlayer))
  );
});

// 2 - Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecificPlayerQuery = `
        SELECT * FROM player_details
        WHERE
        player_id = ${playerId};
    `;
  const specificPlayer = await db.get(getSpecificPlayerQuery);
  response.send(returnAllPlayersConversion(specificPlayer));
});

// 3 - Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const updatedPlayerBody = request.body;
  const { playerName } = updatedPlayerBody;
  const updatePlayerQuery = `
    UPDATE player_details
    SET
    player_name = '${playerName}'
    WHERE player_id = ${playerId};
  `;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

// 4 - Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getSpecificMatchQuery = `
        SELECT * FROM match_details
        WHERE
        match_id = ${matchId};
    `;
  const specificMatch = await db.get(getSpecificMatchQuery);
  response.send(returnSpecificMatch(specificMatch));
});

// 5 - Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchesOfPlayerQuery = `
        SELECT match_details.match_id AS matchId, 
        match_details.match, match_details.year
        FROM match_details
        INNER JOIN player_match_score
        ON 
        match_details.match_id = player_match_score.match_id
        WHERE player_id = ${playerId}
    `;
  const matchesOfAPlayer = await db.all(getAllMatchesOfPlayerQuery);
  response.send(matchesOfAPlayer);
});

// 6 - Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerOfMatchQuery = `
        SELECT player_details.player_id AS playerId,
        player_details.player_name AS playerName 
        FROM player_details INNER join
        player_match_score 
        ON player_details.player_id = player_match_score.player_id
        WHERE player_match_score.match_id = ${matchId};
    `;
  const listOfPlayerOfMatch = await db.all(getPlayerOfMatchQuery);
  response.send(listOfPlayerOfMatch);
});

// 7 - Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatisticsQuery = `
        SELECT player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
        FROM player_details 
        INNER JOIN player_match_score ON
        player_details.player_id = player_match_score.player_id
        WHERE player_details.player_id = ${playerId}
    `;
  const playerStatistics = await db.get(getPlayerStatisticsQuery);
  response.send(playerStatistics);
});

module.exports = app;
