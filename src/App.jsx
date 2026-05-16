import { useState, useEffect, useRef } from "react"

export default function App() {
  const clickSoundRef = useRef(null)
  const countdownSoundRef = useRef(null)
  const hitSoundRef = useRef(null)
  const winSoundRef = useRef(null)
  const loseSoundRef = useRef(null)
  const bgmSoundRef = useRef(null)

  useEffect(() => {
    clickSoundRef.current = new Audio("/sounds/click.mp3")
    countdownSoundRef.current = new Audio("/sounds/countdown.mp3")
    hitSoundRef.current = new Audio("/sounds/hit.mp3")
    winSoundRef.current = new Audio("/sounds/win.mp3")
    loseSoundRef.current = new Audio("/sounds/lose.mp3")
    const bgm = new Audio("/sounds/bgm.mp3")
    bgm.volume = 0.25
    bgmSoundRef.current = bgm
  }, [])

  const playSound = (soundRef, resetTime = false) => {
    const sound = soundRef.current
    if (sound) {
      if (resetTime) sound.currentTime = 0
      sound.play().catch(() => {})
    }
  }

  const cards = ["石頭", "剪刀", "布"]

  const characters = {
    fire: {
      name: "火焰英雄",
      pairs: [["火","ㄏㄨㄛˇ"],["焰","ㄧㄢˋ"],["英","ㄧㄥ"],["雄","ㄒㄩㄥˊ"]],
      idle: "/fire_idle.png",
      punch: "/fire_punch.png",
      attack: "/fire_attack.png",
      hit: "/fire_hit.png",
      win: "/fire_win.png",
      lose: "/fire_lose.png"
    },
    water: {
      name: "水元素英雄",
      pairs: [["水","ㄕㄨㄟˇ"],["元","ㄩㄢˊ"],["素","ㄙㄨˋ"],["英","ㄧㄥ"],["雄","ㄒㄩㄥˊ"]],
      idle: "/water_idle.png",
      punch: "/water_punch.png",
      attack: "/water_attack.png",
      hit: "/water_hit.png",
      win: "/water_win.png",
      lose: "/water_lose.png"
    },
    tiger: {
      name: "雷電虎戰士",
      pairs: [["雷","ㄌㄟˊ"],["電","ㄉㄧㄢˋ"],["虎","ㄏㄨˇ"],["戰","ㄓㄢˋ"],["士","ㄕˋ"]],
      idle: "/tiger_idle.png",
      punch: "/tiger_punch.png",
      attack: "/tiger_attack.png",
      hit: "/tiger_hit.png",
      win: "/tiger_win.png",
      lose: "/tiger_lose.png"
    }
  }

  const [phase, setPhase] = useState("start")
  const [playerCharacter, setPlayerCharacter] = useState("fire")
  const [enemyCharacter, setEnemyCharacter] = useState("tiger")
  const [playerState, setPlayerState] = useState("idle")
  const [enemyState, setEnemyState] = useState("idle")
  const [leftHearts, setLeftHearts] = useState(3)
  const [rightHearts, setRightHearts] = useState(3)
  const [leftPunch, setLeftPunch] = useState("")
  const [rightPunch, setRightPunch] = useState("")
  const [enemyLeftPunch, setEnemyLeftPunch] = useState("")
  const [enemyRightPunch, setEnemyRightPunch] = useState("")
  const [finalPlayerPunch, setFinalPlayerPunch] = useState("")
  const [finalEnemyPunch, setFinalEnemyPunch] = useState("")
  const [decisionCountdown, setDecisionCountdown] = useState(5)
  const [countdown, setCountdown] = useState(3)
  const [resultText, setResultText] = useState("")
  const [gameOver, setGameOver] = useState(false)
  const [winnerSide, setWinnerSide] = useState("")
  const [hitShake, setHitShake] = useState(false)
  const [battleFreeze, setBattleFreeze] = useState(false)
  const [flashColor, setFlashColor] = useState("transparent")
  const [roundResult, setRoundResult] = useState("") // "win" | "lose" | "draw" | 

  const getCardEmoji = (card) => {
    if (card === "石頭") return "✊"
    if (card === "剪刀") return "✌️"
    return "✋"
  }

  // R(pairs, size)
  // pairs = [["字","ㄗˋ"], ["音","ㄧㄣ"]] 每個字單獨配注音，注音直式排在字右側
  const R = (pairs, size = "inherit") => (
    <span style={{ display: "inline-flex", alignItems: "flex-end", gap: "0.1em", fontSize: size }}>
      {pairs.map(([char, zhu], i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "flex-end" }}>
          <span style={{ lineHeight: 1 }}>{char}</span>
          <span style={{
            writingMode: "vertical-rl",
            fontSize: "0.4em",
            letterSpacing: "0.05em",
            opacity: 0.8,
            lineHeight: 1,
            marginLeft: "0.05em"
          }}>{zhu}</span>
        </span>
      ))}
    </span>
  )

  const getCharacterImage = (character, state) => characters[character][state]

  const renderHearts = (count) =>
    Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        style={{
          fontSize: "26px",
          animation: count === 1 ? "heartPulse 0.7s infinite" : "none"
        }}
      >
        ❤️
      </span>
    ))

  const cardStyle = (selected) => ({
    width: "88px",
    height: "110px",
    borderRadius: "20px",
    background: selected
      ? "linear-gradient(to bottom, #ffd000, #ff8800)"
      : "linear-gradient(to bottom, #333, #111)",
    border: selected ? "3px solid #fff" : "2px solid #555",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    transform: selected ? "scale(1.1) translateY(-6px)" : "scale(1)",
    boxShadow: selected ? "0 0 24px #ffd000aa" : "none",
    transition: "0.18s",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent"
  })

  const generateEnemyPunches = () => {
    setEnemyLeftPunch(cards[Math.floor(Math.random() * 3)])
    setEnemyRightPunch(cards[Math.floor(Math.random() * 3)])
  }

  const getEnemyFinalPunch = () => {
    const options = [enemyLeftPunch, enemyRightPunch]
    return options[Math.floor(Math.random() * options.length)]
  }

  const judgeBattle = (player, enemy) => {
    if (player === enemy) return "draw"
    if (
      (player === "石頭" && enemy === "剪刀") ||
      (player === "剪刀" && enemy === "布") ||
      (player === "布" && enemy === "石頭")
    ) return "win"
    return "lose"
  }

  const triggerFlash = (color) => {
    setFlashColor(color)
    setTimeout(() => setFlashColor("transparent"), 180)
  }

  const triggerHitEffect = (side) => {
    setBattleFreeze(true)
    setTimeout(() => {
      setBattleFreeze(false)
      setWinnerSide(side)
      setHitShake(true)
      setTimeout(() => {
        setHitShake(false)
        setWinnerSide("")
      }, 1500)
    }, 150)
  }

  useEffect(() => {
    if (phase !== "pick" && phase !== "finalPick") return
    if (decisionCountdown <= 0) {
      if (phase === "pick") {
        const r1 = cards[Math.floor(Math.random() * 3)]
        const r2 = cards[Math.floor(Math.random() * 3)]
        setLeftPunch(lp => lp || r1)
        setRightPunch(rp => rp || r2)
        setTimeout(() => {
          setCountdown(3)
          setResultText("reveal")
          setPhase("countdownReveal")
        }, 500)
      }
      if (phase === "finalPick") {
        chooseFinalPunch(leftPunch || rightPunch)
      }
      return
    }
    const timer = setTimeout(() => {
      playSound(countdownSoundRef, true)
      setDecisionCountdown(prev => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [decisionCountdown, phase])

  useEffect(() => {
    if (phase !== "countdownReveal" && phase !== "countdownBattle") return
    if (countdown <= 0) {
      if (phase === "countdownReveal") {
        generateEnemyPunches()
        setDecisionCountdown(5)
        setResultText("final")
        setPhase("finalPick")
      }
      if (phase === "countdownBattle") {
        const enemyFinal = getEnemyFinalPunch()
        setFinalEnemyPunch(enemyFinal)
        const result = judgeBattle(finalPlayerPunch, enemyFinal)
        playSound(hitSoundRef, true)
        triggerHitEffect(result)

        if (result === "draw") {
          triggerFlash("white")
          setPlayerState("hit")
          setEnemyState("hit")
          const nL = Math.max(leftHearts - 1, 0)
          const nR = Math.max(rightHearts - 1, 0)
          setLeftHearts(nL)
          setRightHearts(nR)
          setResultText("平手")
          setRoundResult("draw")
          setTimeout(() => setRoundResult(""), 1500)
          if (nL <= 0 || nR <= 0) {
            if (nL <= 0) { playSound(loseSoundRef, true); setPlayerState("lose"); setEnemyState("win") }
            else { playSound(winSoundRef, true); setPlayerState("win"); setEnemyState("lose") }
            setGameOver(true)
          } else setTimeout(() => { setPlayerState("idle"); setEnemyState("idle") }, 2200)
        } else if (result === "win") {
          triggerFlash("#ffd000")
          setPlayerState("attack")
          setEnemyState("hit")
          const nR = Math.max(rightHearts - 1, 0)
          setRightHearts(nR)
          setResultText("win")
          setRoundResult("win")
          setTimeout(() => setRoundResult(""), 1500)
          if (nR <= 0) { setPlayerState("win"); setEnemyState("lose"); setGameOver(true) }
          else setTimeout(() => { setPlayerState("idle"); setEnemyState("idle") }, 2200)
        } else {
          triggerFlash("#ff3030")
          setPlayerState("hit")
          setEnemyState("attack")
          const nL = Math.max(leftHearts - 1, 0)
          setLeftHearts(nL)
          setResultText("lose")
          setRoundResult("lose")
          setTimeout(() => setRoundResult(""), 1500)
          if (nL <= 0) { setPlayerState("lose"); setEnemyState("win"); setGameOver(true) }
          else setTimeout(() => { setPlayerState("idle"); setEnemyState("idle") }, 2200)
        }
        setPhase("result")
      }
      return
    }
    const timer = setTimeout(() => {
      playSound(countdownSoundRef, true)
      setCountdown(prev => prev - 1)
    }, 1000)
    return () => clearTimeout(timer)
  }, [countdown, phase, finalPlayerPunch])

  const chooseFinalPunch = (card) => {
    playSound(clickSoundRef, true)
    setFinalPlayerPunch(card)
    setPlayerState("punch")
    setEnemyState("punch")
    setCountdown(3)
    setResultText("最終出拳倒數")
    setPhase("countdownBattle")
  }

  const nextRound = () => {
    setLeftPunch("")
    setRightPunch("")
    setEnemyLeftPunch("")
    setEnemyRightPunch("")
    setFinalPlayerPunch("")
    setFinalEnemyPunch("")
    setPlayerState("idle")
    setEnemyState("idle")
    setDecisionCountdown(5)
    setResultText("pick")
    setPhase("pick")
  }

  const restartGame = () => {
    setLeftHearts(3)
    setRightHearts(3)
    setLeftPunch("")
    setRightPunch("")
    setEnemyLeftPunch("")
    setEnemyRightPunch("")
    setFinalPlayerPunch("")
    setFinalEnemyPunch("")
    setPlayerState("idle")
    setEnemyState("idle")
    setGameOver(false)
    setResultText("按開始遊戲")
    setPhase("start")
  }

  const isGamePhase = ["pick", "finalPick", "countdownReveal", "countdownBattle", "result"].includes(phase)
  const countdownDisplay =
    phase === "pick" || phase === "finalPick" ? decisionCountdown
    : phase === "countdownReveal" || phase === "countdownBattle" ? countdown
    : null

  return (
    <div style={{
      width: "100%",
      height: "100dvh",
      background: "linear-gradient(to bottom, #0a0a1a, #000)",
      color: "white",
      fontFamily: "sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      position: "relative",
      userSelect: "none"
    }}>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) scaleX(-1); }
          50% { transform: translateY(-8px) scaleX(-1); }
          100% { transform: translateY(0px) scaleX(-1); }
        }
        @keyframes floatNormal {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes heartPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes shakeLeft {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-18px); }
          75% { transform: translateX(8px); }
        }
        @keyframes resultPop {
          0%   { transform: translate(-50%,-50%) scale(0.4); opacity: 0; }
          60%  { transform: translate(-50%,-50%) scale(1.15); opacity: 1; }
          80%  { transform: translate(-50%,-50%) scale(0.95); }
          100% { transform: translate(-50%,-50%) scale(1); opacity: 1; }
        }
        @keyframes resultFade {
          0%   { opacity: 1; }
          70%  { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes shakeRight {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(18px); }
          75% { transform: translateX(-8px); }
        }
        .btn-main {
          padding: 16px 0;
          width: 100%;
          max-width: 280px;
          border-radius: 999px;
          border: none;
          font-size: 22px;
          font-weight: 900;
          cursor: pointer;
          letter-spacing: 1px;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
      `}</style>

      {/* 閃光覆蓋層 */}
      <div style={{
        position: "fixed", inset: 0,
        background: flashColor,
        opacity: 0.3,
        pointerEvents: "none",
        transition: "0.15s",
        zIndex: 99
      }} />

      {/* ── 賽果彈出層 ── */}
      {roundResult && (
        <div style={{
          position: "fixed", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
          zIndex: 200,
          animation: "resultFade 1.5s ease forwards"
        }}>
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            textAlign: "center",
            animation: "resultPop 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards"
          }}>
            {roundResult === "win" && (
              <div>
                <div style={{ fontSize: "90px", lineHeight: 1 }}>🏆</div>
                <div style={{
                  fontSize: "72px", fontWeight: "900", lineHeight: 1, marginTop: "8px",
                  color: "#ffd000",
                  textShadow: "0 0 40px #ffd000, 0 4px 0 #a86000"
                }}>
                  {R([["贏","ㄧㄥˊ"],["了","ㄌㄜ˙"]],"72px")}！
                </div>
              </div>
            )}
            {roundResult === "lose" && (
              <div>
                <div style={{ fontSize: "90px", lineHeight: 1 }}>💀</div>
                <div style={{
                  fontSize: "72px", fontWeight: "900", lineHeight: 1, marginTop: "8px",
                  color: "#ff4444",
                  textShadow: "0 0 40px #ff2222, 0 4px 0 #800"
                }}>
                  {R([["輸","ㄕㄨ"],["了","ㄌㄜ˙"]],"72px")}
                </div>
              </div>
            )}
            {roundResult === "draw" && (
              <div>
                <div style={{ fontSize: "90px", lineHeight: 1 }}>🤝</div>
                <div style={{
                  fontSize: "72px", fontWeight: "900", lineHeight: 1, marginTop: "8px",
                  color: "#cccccc",
                  textShadow: "0 0 30px #888, 0 4px 0 #444"
                }}>
                  {R([["平","ㄆㄧㄥˊ"],["手","ㄕㄡˇ"]],"72px")}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── START 畫面 ── */}
      {phase === "start" && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "32px", padding: "0 24px"
        }}>
          <div style={{ fontSize: "48px", fontWeight: "900", color: "#ffd000", letterSpacing: 2, textAlign: "center" }}>
            {R([["雙","ㄕㄨㄤ"],["拳","ㄑㄩㄢˊ"],["大","ㄉㄚˋ"],["戰","ㄓㄢˋ"]],"48px")}
          </div>
          <div style={{ fontSize: "60px" }}>✊✌️✋</div>
          <button
            className="btn-main"
            onClick={() => {
              playSound(clickSoundRef, true)
              playSound(bgmSoundRef)
              setPhase("selectPlayer")
            }}
            style={{ background: "#ff4d4d", color: "white" }}
          >
            {R([["開","ㄎㄞ"],["始","ㄕˇ"],["遊","ㄧㄡˊ"],["戲","ㄒㄧˋ"]],"22px")}
          </button>
        </div>
      )}

      {/* ── 選角色 ── */}
      {(phase === "selectPlayer" || phase === "selectEnemy") && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", padding: "24px 16px", gap: "20px"
        }}>
          <div style={{ fontSize: "24px", fontWeight: "900", marginTop: "8px" }}>
            {phase === "selectPlayer"
              ? R([["選","ㄒㄩㄢˇ"],["你","ㄋㄧˇ"],["的","ㄉㄜ˙"],["角","ㄐㄩㄝˊ"],["色","ㄙㄜˋ"]],"24px")
              : R([["選","ㄒㄩㄢˇ"],["敵","ㄉㄧˊ"],["人","ㄖㄣˊ"]],"24px")}
          </div>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
            {Object.keys(characters).map(key => (
              <div
                key={key}
                onClick={() => {
                  playSound(clickSoundRef, true)
                  if (phase === "selectPlayer") {
                    setPlayerCharacter(key)
                    setPhase("selectEnemy")
                  } else {
                    setEnemyCharacter(key)
                    setDecisionCountdown(5)
                    setResultText("pick")
                    setPhase("pick")
                  }
                }}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: "8px", cursor: "pointer",
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: "20px", padding: "12px 16px",
                  border: "2px solid rgba(255,255,255,0.12)",
                  WebkitTapHighlightColor: "transparent"
                }}
              >
                <img src={characters[key].idle} style={{ width: "100px", height: "100px", objectFit: "contain" }} alt={key} />
                <div style={{ fontSize: "14px", fontWeight: "700" }}>
                  {R(characters[key].pairs,"14px")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* ── 戰鬥畫面 ── */}
      {isGamePhase && (
        <>
          {/* HUD 區：血量 + 倒數 + 結果文字 */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 20px 8px",
            background: "rgba(0,0,0,0.4)",
            borderBottom: "1px solid rgba(255,255,255,0.08)"
          }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: "600" }}>
                {R([["玩","ㄨㄢˊ"],["家","ㄐㄧㄚ"]],"11px")}
              </div>
              <div style={{ display: "flex" }}>{renderHearts(leftHearts)}</div>
            </div>

            <div style={{ textAlign: "center" }}>
              {countdownDisplay !== null && (
                <div style={{
                  fontSize: countdownDisplay <= 3 ? "52px" : "44px",
                  fontWeight: "900",
                  color: countdownDisplay <= 2 ? "#ff4444" : "#ffd000",
                  lineHeight: 1,
                  transition: "0.15s"
                }}>
                  {countdownDisplay}
                </div>
              )}
              <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)", marginTop: "2px", fontWeight: "600" }}>
                {resultText === "pick" && R([["選","ㄒㄩㄢˇ"],["拳","ㄑㄩㄢˊ"]],"13px")}
                {resultText === "reveal" && R([["公","ㄍㄨㄥ"],["開","ㄎㄞ"],["中","ㄓㄨㄥ"]],"13px")}
                {resultText === "final" && R([["選","ㄒㄩㄢˇ"],["最","ㄗㄨㄟˋ"],["後","ㄏㄡˋ"],["一","ㄧˋ"],["拳","ㄑㄩㄢˊ"]],"13px")}
                {resultText === "win" && <span style={{ color: "#ffd000" }}>🏆 {R([["贏","ㄧㄥˊ"],["了","ㄌㄜ˙"]],"13px")}！</span>}
                {resultText === "lose" && <span style={{ color: "#ff4444" }}>💀 {R([["輸","ㄕㄨ"],["了","ㄌㄜ˙"]],"13px")}</span>}
                {resultText === "平手" && <span style={{ color: "#aaa" }}>{R([["平","ㄆㄧㄥˊ"],["手","ㄕㄡˇ"]],"13px")}</span>}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: "600" }}>
                {R([["電","ㄉㄧㄢˋ"],["腦","ㄋㄠˇ"]],"11px")}
              </div>
              <div style={{ display: "flex" }}>{renderHearts(rightHearts)}</div>
            </div>
          </div>

          {/* 戰場：敵人（上）+ 玩家（下）垂直排列 */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "space-around",
            padding: "8px 0"
          }}>
            {/* 敵人 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginBottom: "4px" }}>
                {R(characters[enemyCharacter].pairs,"11px")}
              </div>
              <img
                src={getCharacterImage(enemyCharacter, enemyState)}
                style={{
                  width: "110px",
                  height: "110px",
                  objectFit: "contain",
                  animation: enemyState === "idle" ? "float 2s ease-in-out infinite" : "none",
                  transform: battleFreeze ? "scale(1.2)" :
                    (hitShake && winnerSide === "win") ? undefined : "scaleX(-1)",
                  animationName: enemyState === "idle" ? "float" : "none",
                  filter: winnerSide === "lose" ? "drop-shadow(0 0 30px #ff3030)" : "none",
                  transition: "0.25s"
                }}
                alt="enemy"
              />
            </div>

            {/* VS 分隔 */}
            {phase === "result" && (
              <div style={{ fontSize: "32px", fontWeight: "900", color: "rgba(255,255,255,0.2)" }}>
                {getCardEmoji(finalPlayerPunch)} VS {getCardEmoji(finalEnemyPunch)}
              </div>
            )}
            {phase !== "result" && (
              <div style={{ fontSize: "22px", color: "rgba(255,255,255,0.15)", fontWeight: "900" }}>— VS —</div>
            )}

            {/* 玩家 */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img
                src={getCharacterImage(playerCharacter, playerState)}
                style={{
                  width: "110px",
                  height: "110px",
                  objectFit: "contain",
                  animation: playerState === "idle" ? "floatNormal 2s ease-in-out infinite" : "none",
                  transform: battleFreeze ? "scale(1.2)" :
                    (hitShake && winnerSide === "lose") ? undefined : "scale(1)",
                  filter: winnerSide === "win" ? "drop-shadow(0 0 30px #ffd000)" : "none",
                  transition: "0.25s"
                }}
                alt="player"
              />
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "4px" }}>
                {R(characters[playerCharacter].pairs,"11px")}
              </div>
            </div>
          </div>

          {/* ── 底部操作區 ── */}
          <div style={{
            background: "rgba(0,0,0,0.55)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            padding: "10px 16px 16px"
          }}>

            {/* 選左右拳 */}
            {phase === "pick" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginBottom: "8px", textAlign: "center" }}>
                    {R([["左","ㄗㄨㄛˇ"],["拳","ㄑㄩㄢˊ"]],"13px")} {leftPunch && getCardEmoji(leftPunch)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    {cards.map(card => (
                      <div key={card} onClick={() => { playSound(clickSoundRef, true); setLeftPunch(card) }} style={cardStyle(leftPunch === card)}>
                        <div style={{ fontSize: "34px" }}>{getCardEmoji(card)}</div>
                        <div style={{ fontSize: "11px", marginTop: "4px", color: leftPunch === card ? "#000" : "#ccc" }}>
                          {card === "石頭" && R([["石","ㄕˊ"],["頭","ㄊㄡˊ"]],"11px")}
                          {card === "剪刀" && R([["剪","ㄐㄧㄢˇ"],["刀","ㄉㄠ"]],"11px")}
                          {card === "布" && R([["布","ㄅㄨˋ"]],"11px")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", marginBottom: "8px", textAlign: "center" }}>
                    {R([["右","ㄧㄡˋ"],["拳","ㄑㄩㄢˊ"]],"13px")} {rightPunch && getCardEmoji(rightPunch)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
                    {cards.map(card => (
                      <div key={card} onClick={() => { playSound(clickSoundRef, true); setRightPunch(card) }} style={cardStyle(rightPunch === card)}>
                        <div style={{ fontSize: "34px" }}>{getCardEmoji(card)}</div>
                        <div style={{ fontSize: "11px", marginTop: "4px", color: rightPunch === card ? "#000" : "#ccc" }}>
                          {card === "石頭" && R([["石","ㄕˊ"],["頭","ㄊㄡˊ"]],"11px")}
                          {card === "剪刀" && R([["剪","ㄐㄧㄢˇ"],["刀","ㄉㄠ"]],"11px")}
                          {card === "布" && R([["布","ㄅㄨˋ"]],"11px")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 選最終拳 */}
            {phase === "finalPick" && (
              <div>
                <div style={{ textAlign: "center", marginBottom: "10px" }}>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{R([["我","ㄨㄛˇ"]],"11px")} </span>
                  <span style={{ fontSize: "26px" }}>{getCardEmoji(leftPunch)} {getCardEmoji(rightPunch)}</span>
                  <span style={{ fontSize: "18px", margin: "0 8px", color: "rgba(255,255,255,0.3)" }}>|</span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{R([["敵","ㄉㄧˊ"]],"11px")} </span>
                  <span style={{ fontSize: "26px" }}>{getCardEmoji(enemyLeftPunch)} {getCardEmoji(enemyRightPunch)}</span>
                </div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.55)", textAlign: "center", marginBottom: "10px" }}>
                  {R([["出","ㄔㄨ"],["最","ㄗㄨㄟˋ"],["後","ㄏㄡˋ"],["一","ㄧˋ"],["拳","ㄑㄩㄢˊ"]],"13px")}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
                  {[leftPunch, rightPunch].map((card, i) => (
                    <div key={i} onClick={() => chooseFinalPunch(card)} style={cardStyle(false)}>
                      <div style={{ fontSize: "38px" }}>{getCardEmoji(card)}</div>
                      <div style={{ fontSize: "11px", marginTop: "4px", color: "#ccc" }}>
                        {card === "石頭" && R([["石","ㄕˊ"],["頭","ㄊㄡˊ"]],"11px")}
                        {card === "剪刀" && R([["剪","ㄐㄧㄢˇ"],["刀","ㄉㄠ"]],"11px")}
                        {card === "布" && R([["布","ㄅㄨˋ"]],"11px")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 倒數中 */}
            {(phase === "countdownReveal" || phase === "countdownBattle") && (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: "28px" }}>⚡</div>
              </div>
            )}

            {/* 結果 + 下一關 */}
            {phase === "result" && !gameOver && (
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button
                  className="btn-main"
                  onClick={nextRound}
                  style={{ background: "#00c96b", color: "white" }}
                >
                  {R([["下","ㄒㄧㄚˋ"],["一","ㄧˋ"],["關","ㄍㄨㄢ"]],"22px")} ▶
                </button>
              </div>
            )}

            {/* 遊戲結束 */}
            {gameOver && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <div style={{ fontSize: "32px", fontWeight: "900", color: "#ffd000", letterSpacing: 2 }}>
                  GAME OVER
                </div>
                <div style={{ fontSize: "20px" }}>
                  {leftHearts <= 0
                    ? <span>💀 {R([["你","ㄋㄧˇ"],["輸","ㄕㄨ"],["了","ㄌㄜ˙"]],"20px")}</span>
                    : <span>🏆 {R([["你","ㄋㄧˇ"],["贏","ㄧㄥˊ"],["了","ㄌㄜ˙"]],"20px")}！</span>}
                </div>
                <button
                  className="btn-main"
                  onClick={restartGame}
                  style={{ background: "#ff4d4d", color: "white" }}
                >
                  {R([["再","ㄗㄞˋ"],["玩","ㄨㄢˊ"],["一","ㄧˋ"],["次","ㄘˋ"]],"22px")}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}