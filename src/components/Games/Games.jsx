import "./games.css"
import Game from "./Game"
import { useState, useEffect } from "react"
import BeatLoader from 'react-spinners/BeatLoader'
import { Grid, Box, MenuItem, FormControl, InputLabel, Select, Slider, Typography, TextField } from '@mui/material';
import { Button, Collapse } from '@mui/material';

export default function Games() {    
  const [games, setGames] = useState([])
  const [gameNames, setGameNames] = useState([])
  const [searchInput, setSearchInput] = useState(null)
  const [isLoading, setLoading] = useState(false)
  const [playerCount, setPlayerCount] = useState("");
  const [maxComplexity, setMaxComplexity] = useState(5);
  const [maxDuration, setMaxDuration] = useState(240);
  const [language, setLanguage] = useState("Alle");
  const [showFilters, setShowFilters] = useState(false);

  const API_KEY = "AIzaSyCklZWwaXvgmkfyq61E67DXNGpgYAwTapg"
  const SHEET_ID = "1Jn6LMK_MDTWrT_bZ8HjB6tLNpUHbsH-8w3I6y38dYlA"
  const SHEET_TAB_NAME = "Spieleliste"

  useEffect(() => {
    async function fetchGames() {
      setLoading(true)

      const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_TAB_NAME}?alt=json&key=${API_KEY}`)
      const data = await response.json()

      const gamesArray = data.values.slice(1)
      setGames(gamesArray)
      setLoading(false)
    }
    fetchGames()
  }, [])

  // opens a new tab to a game's BoardGameGeek's page if user clicks the game's div (or does nothing if it's not a valid game)
  function openBGG(id) {
    if(id) {
      window.open(`https://boardgamegeek.com/boardgame/${id}/`, "_blank", "noreferrer");
    }
  }

  // structure of game object in games
  // 0: "Spiel"
  // 1: "Spieler Min"
  // 2: "Spieler Max"
  // 3: "Spieler Empfohlen"
  // 4: "Spieldauer Min"
  // 5: "Spieldauer Max"
  // 6: "Complexity"
  // 7: "BGG ID"
  // 8: "Sprache"
  // 9: "Kinderspiel"

  // per default display all games
  const displayedGames = games.filter(game => {
    const name = game[0] || "";
    const matchesSearch = !searchInput ||
      name.toLowerCase().includes(searchInput.toLowerCase());

    if (game.length <= 1) return matchesSearch;

    const count = parseInt(playerCount);
    const matchesPlayers = !isNaN(count) && game[1] && game[2]
      ? (count >= parseInt(game[1]) && count <= parseInt(game[2]))
      : true;

    const comp = game[6] ? parseFloat(game[6].toString().replace(',', '.')) : 0;
    const matchesComplexity = isNaN(comp) || comp <= maxComplexity;

    const matchesDuration = (maxDuration >= 240)
      ? true                                   
      : (parseInt(game[5]) || 0) <= maxDuration;

    const matchesLanguage = language === "Alle" ||
      (game[8] && game[8].toLowerCase() === language.toLowerCase());

    return matchesSearch && matchesPlayers && matchesComplexity && matchesDuration && matchesLanguage;
  });

  const gameElements = displayedGames.map(game => 
    <Game
      key={game[0]}
      name={game[0]}
      playersMin={game[1]}
      playersMax={game[2]} 
      lengthMin={game[4]} 
      lengthMax={game[5]} 
      complexity={game[6]} 
      bggId={game[7]}
      language={game[8]} 
      childGame={game[9]}
      onClick={openBGG}
    />
  )

  return (
    <section className="content maxWidth1200">
      <h1 className="title supersonic">Spieleliste</h1>
      <div className="tile shadow">
        <p className="justified">
          Hier findet ihr eine Liste aller unserer Spiele. Nutze die Filter, um das perfekte Spiel für deine Gruppe zu finden.
        </p>

        {/* Filter Container */}
        <Box sx={{ flexGrow: 1, mb: 4, p: 3, bgcolor: '#f9f9f9', borderRadius: 2, border: '1px solid #ddd' }}>
          <Grid container spacing={3} alignItems="center">

            {/* Primary Search - Always Visible */}
            <Grid item xs={12} md={9}>
              <TextField
                fullWidth
                label="Titel suchen"
                variant="outlined"
                value={searchInput || ""}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </Grid>

            {/* Toggle Button - Always Visible */}
            <Grid item xs={12} md={3} sx={{ textAlign: { md: 'right', xs: 'left' } }}>
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="text"
                sx={{ color: '#000' }}
              >
                {showFilters ? "Weniger Filter ↑" : "Mehr Filter ↓"}
              </Button>
            </Grid>

            {/* Advanced Filters - Collapsible */}
            <Grid item xs={12} sx={{ p: '0 !important' }}>
              <Collapse in={showFilters}>
                <Grid container spacing={3} sx={{ p: 3, pt: 1 }}>

                  {/* Players */}
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Personen"
                      value={playerCount}
                      onChange={(e) => setPlayerCount(e.target.value)}
                    />
                  </Grid>

                  {/* Language */}
                  <Grid item xs={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Sprache</InputLabel>
                      <Select
                        value={language}
                        label="Sprache"
                        onChange={(e) => setLanguage(e.target.value)}
                      >
                        <MenuItem value="Alle">Alle</MenuItem>
                        <MenuItem value="deutsch">Deutsch</MenuItem>
                        <MenuItem value="englisch">English</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Complexity Slider */}
                  <Grid item xs={12} md={3}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Max. Komplexität: {maxComplexity}
                    </Typography>
                    <Slider
                      value={maxComplexity}
                      min={1} max={5} step={0.1}
                      onChange={(e, val) => setMaxComplexity(val)}
                      valueLabelDisplay="auto"
                    />
                  </Grid>

                  {/* Duration Slider */}
                  <Grid item xs={12} md={3}>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Max. Zeit: {maxDuration} Min.
                    </Typography>
                    <Slider
                      value={maxDuration}
                      min={15} max={240} step={15}
                      onChange={(e, val) => setMaxDuration(val)}
                      valueLabelDisplay="auto"
                    />
                  </Grid>
                </Grid>
              </Collapse>
            </Grid>
          </Grid>

          {/* Footer of Filter Box */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 1, borderTop: '1px solid #eee' }}>
            <Button
              size="small"
              sx={{ color: '#999', textTransform: 'none' }}
              onClick={() => {
                setSearchInput("");
                setPlayerCount("");
                setMaxComplexity(5);
                setMaxDuration(240);
                setLanguage("Alle");
              }}
            >
              Filter zurücksetzen
            </Button>

            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              {displayedGames.length} Treffer
            </Typography>
          </Box>
        </Box>

        {isLoading ? (
          <div className="section--games--loader" style={{ textAlign: 'center', padding: '40px' }}>
            <BeatLoader color={"#00B0B2"} />
          </div>
        ) : (
          <div className="section--games--list">
            {gameElements.length > 0 ? (
              gameElements
            ) : (
              <Typography sx={{ textAlign: 'center', mt: 4, color: 'gray' }}>
                Keine Spiele gefunden, die diesen Kriterien entsprechen.
              </Typography>
            )}
          </div>
        )}
      </div>
    </section>
  );
}