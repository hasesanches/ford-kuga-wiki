<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'

import { auth } from '@/firebase'
import AdminTable from './AdminTable.vue'

/* ---------- auth ---------- */
const email = ref('')
const password = ref('')
const authorized = ref(false)
const checkingAuth = ref(true)
const error = ref('')

async function login() {
  error.value = ''
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
  } catch {
    error.value = 'Неверный email или пароль'
  }
}

async function logout() {
  await signOut(auth)
}

/* ---------- admin check ---------- */
async function checkAdmin(user: any) {
  const token = await user.getIdTokenResult()
  return token.claims.admin === true
}

onMounted(() => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      authorized.value = false
      checkingAuth.value = false
      return
    }

    const isAdmin = await checkAdmin(user)
    if (!isAdmin) {
      error.value = 'Нет прав администратора'
      await signOut(auth)
    }

    authorized.value = isAdmin
    checkingAuth.value = false
  })
})


</script>


<template>
  <div>
    <!-- проверка auth -->
    <div v-if="checkingAuth">Проверка доступа…</div>

    <!-- логин -->
    <div v-else-if="!authorized" class="login-form">
      <h2>Вход в админку</h2>

      <input
          v-model="email"
          type="email"
          placeholder="Email"
      />

      <input
          v-model="password"
          type="password"
          placeholder="Пароль"
          @keyup.enter="login"
      />

      <button @click="login">Войти</button>

      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <AdminTable v-else :logout="logout"/>
  </div>
</template>

<style scoped>
.login-form {
  max-width: 320px;
  margin: 100px auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

input {
  padding: 8px;
  font-size: 16px;
}

button {
  padding: 8px;
  font-size: 16px;
  cursor: pointer;
}

.error {
  color: red;
}

</style>
