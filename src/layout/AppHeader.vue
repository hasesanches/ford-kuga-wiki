<template>
  <header class="header">
    <button class="burger" @click="$emit('toggle-menu')">☰</button>
    <img src="/logo.png" class="logo"  alt="Ford Kuga mk1 WIKI"/>
    <div class="title">Ford Kuga mk1 WIKI</div>
  </header>
</template>

<style scoped>
.header {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px 20px;
  background: #111;
  color: #fff;
}

.logo {
  display: flex;
  height: 40px;
}

.title {
  font-size: 36px;
}

.burger {
  font-size: 22px;
  background: none;
  border: none;
  color: #fff;
  display: none;
}

/* 📱 */
@media (max-width: 768px) {
  .burger {
    display: block;
  }
  .title {
    font-size: 24px;
  }
  .logo {
    height: 30px;
  }
}
</style>
