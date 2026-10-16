// 引入 Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ 請替換成你在 Firebase 得到的專案設定 ⚠️
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 初始化 Firebase 與資料庫
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const commentsRef = collection(db, "comments");

// 劇本資料
const storyData = {
  start: {
    title: "【疑雲叢生】",
    image: "https://github.com/ling11250/animal-game-images/blob/main/node0.jpg?raw=true",
    text: "社團內有志工發起警訊，表示送給江男的幼貓已經超過一個月沒有回報近況。",
    options: [
      { text: "私下聯繫其他送養人，串聯大家手中的證據。", next: "nodeA" },
      { text: "直接到江男的個人臉書貼文下留言質問：「貓到底在哪裡？給個交代！」", next: "nodeB" }
    ]
  },
  nodeA: {
    title: "【時間軸與對話紀錄】",
    image: "https://raw.githubusercontent.com/ling11250/animal-game-images/main/nodeA.jpg",
    text: "你成功串聯了5位送養人，發現領養的貓均死亡或失聯！此時，江男主動在臉書社團「花蓮人」發文，稱「貓是被流浪狗咬死的，不干我的事」。",
    options: [
      { text: "公開要求他出示診所看診藥袋、就醫紀錄或火化證明，並將所有資料備份。", next: "end1" },
      { text: "直接在貼文下大罵他虐貓，號召網友晚上去他的住處堵人。", next: "end4" }
    ]
  },
  nodeB: {
    title: "【打草驚蛇】",
    image: "https://raw.githubusercontent.com/ling11250/animal-game-images/main/nodeB.jpg",
    text: "你在網路上的留言引來江男警覺，他私訊嗆你：「我只是沒做好居家防護貓跑掉，再亂講我要告你公然侮辱！」隨後迅速將你封鎖，並關閉個人版面。",
    options: [
      { text: "立刻停止網路對罵，轉為私下向動保處與警方檢舉，並提供現有的截圖。", next: "end2" },
      { text: "將江男的個資公佈到各大爆料社團，號召網民肉搜發動網暴。", next: "end3" }
    ]
  },

  // 🏆 結局一：完美結局
  end1: {
    title: "🏆 結局一：【法網恢恢】",
    image: "https://raw.githubusercontent.com/ling11250/animal-game-images/main/end1.jpg",
    text: "面對你列出的證據，江男完全拿不出證明。你將完整且具備法律效力的事證提交給花蓮縣動保處與警方。主管機關依法強制稽查，並依《動保法》第25條移送法辦，同時將其列入全台黑名單，徹底阻止了下一次的悲劇。",
    options: [{ text: "🔄 重新開始（首頁）", next: "home" }]
  },

  // ⚠️ 結局二：遺撼結局
  end2: {
    title: "⚠️ 結局二：【打草驚蛇，真相沉大海】",
    image: "https://raw.githubusercontent.com/ling11250/animal-game-images/main/end2.jpg",
    text: "由於未及時搜集完整證據，江男斷聯並連夜搬離吉安鄉。動保處前往稽查時已人去樓空，因為缺乏關鍵證據，案件因此停擺，剩餘失聯貓咪的下落成為永遠的謎。",
    options: [{ text: "🔄 重新開始（首頁）", next: "home" }]
  },

  // 💣 結局三：壞結局
  end3: {
    title: "💣 結局三：【兩敗俱傷！正義大翻車】",
    image: "https://raw.githubusercontent.com/ling11250/animal-game-images/main/end3.jpg",
    text: "肉搜與網路公審引發暴力砸蛋，江男反手提告！輿論瞬間變成「網路霸凌爭議」，你面臨高額賠償與官司纏身，而貓咪真相反而被大眾徹底遺忘……",
    options: [{ text: "🔄 重新開始（首頁）", next: "home" }]
  },

  // 🩸 結局四：慘烈結局
  end4: {
    title: "🩸 結局四：【衝突升級！私刑正義的代價】",
    image: "https://raw.githubusercontent.com/ling11250/animal-game-images/main/end4.jpg",
    text: "衝動號召現場堵人引發激烈衝突，江男持械防衛導致多人受傷。快打部隊將所有人逮捕，動保訴求被媒體定調為「治安聚眾滋事」，搜證徹底中斷，大作戰全面敗北！",
    options: [{ text: "🔄 重新開始（首頁）", next: "home" }]
  }
};

// 點擊「開始調查」觸發
window.startGame = function() {
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");
  document.getElementById("ending-reports-container").classList.add("hidden");    
  document.getElementById("comment-section").classList.add("hidden"); 
  renderNode("start");
};

// 渲染遊戲節點與關卡判斷
function renderNode(nodeKey) {
  if (nodeKey === "home") {
    document.getElementById("game-screen").classList.add("hidden");
    document.getElementById("ending-reports-container").classList.add("hidden");    
    document.getElementById("comment-section").classList.add("hidden"); 
    document.getElementById("start-screen").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const node = storyData[nodeKey];
  document.getElementById("node-title").innerText = node.title;
  document.getElementById("story-text").innerText = node.text;
  
  const nodeImg = document.getElementById("node-img");
  if (node.image) {
    nodeImg.src = node.image;
    nodeImg.style.display = "block";
  } else {
    nodeImg.style.display = "none";
  }

  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = "";

  node.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn" + (nodeKey.startsWith("end") ? " restart-btn" : "");
    btn.innerText = opt.text;
    btn.onclick = () => renderNode(opt.next);
    optionsContainer.appendChild(btn);
  });

  // 🎯 結局頁面：同時顯示雙報導區塊與留言區
  if (nodeKey.startsWith("end")) {
    document.getElementById("ending-reports-container").classList.remove("hidden");
    document.getElementById("comment-section").classList.remove("hidden");
  } else {
    document.getElementById("ending-reports-container").classList.add("hidden");
    document.getElementById("comment-section").classList.add("hidden");
  }
}

// 💬 發布留言到雲端資料庫
window.postComment = async function() {
  const nameInput = document.getElementById("comment-name");
  const textInput = document.getElementById("comment-text");
  
  const name = nameInput.value.trim() || "熱心志工";
  const text = textInput.value.trim();

  if (!text) {
    alert("請輸入留言內容！");
    return;
  }

  try {
    await addDoc(commentsRef, {
      name: name,
      text: text,
      createdAt: serverTimestamp()
    });
    textInput.value = "";
  } catch (error) {
    console.error("發布失敗:", error);
    alert("留言發布失敗，請確認 Firebase 設定！");
  }
};

// 💬 即時監聽與載入跨裝置留言
const q = query(commentsRef, orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
  const listDiv = document.getElementById("comments-list");
  listDiv.innerHTML = "";

  if (snapshot.empty) {
    listDiv.innerHTML = '<div class="loading-text">目前尚無留言，搶先留下第一條心得吧！</div>';
    return;
  }

  snapshot.forEach((doc) => {
    const data = doc.data();
    const timeStr = data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleString() : "剛剛";
    
    const card = document.createElement("div");
    card.className = "comment-card";
    card.innerHTML = `
      <div class="comment-header">
        <strong>${data.name}</strong>
        <span>${timeStr}</span>
      </div>
      <div class="comment-content">${data.text}</div>
    `;
    listDiv.appendChild(card);
  });
});
