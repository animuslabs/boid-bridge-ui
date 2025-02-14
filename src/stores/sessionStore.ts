import { defineStore } from 'pinia'
import { LocalStorage } from 'quasar'
import { sessionLogin, sessionLogout, sessionRestore } from 'src/lib/session'
import { APIClient } from '@wharfkit/antelope'
import { Session } from '@wharfkit/session'
import { PermissionLevel } from '@wharfkit/session'

export const useSessionStore = defineStore('sessionStore', {
  state: () => ({
    session: undefined as Session | undefined,
    clientAPI: null as APIClient | null,
  }),
  // Getters
  getters: {
    isLoggedIn: (state) => state.session !== undefined,
    username: (state) => state.session?.actor.toString() || '',
    authorization: (state) =>
      PermissionLevel.from(
        (state.session?.permissionLevel as PermissionLevel) || { actor: '', permission: '' },
      ),
    sessionState: (state) => state,
    whatChain: (state) => state.session?.chain.name || '',
    chainUrl: (state) => state.session?.chain.url,
    chainLogo: (state) => state.session?.chain.getLogo() || '',
  },

  // Actions
  actions: {
    async login() {
      const sessionData = await sessionLogin()
      if (sessionData) {
        const serializedSession = sessionData.serialize()
        LocalStorage.set('session', serializedSession)
        console.log('Local Session Chain URL:', sessionData.chain.url)
      }
      this.session = sessionData
    },

    async logout() {
      await sessionLogout()
      LocalStorage.remove('session')
      this.session = undefined
    },

    async renew() {
      const serializedSession = LocalStorage.getItem('session')
      if (serializedSession) {
        this.session = await sessionRestore()
        if (this.session) {
          LocalStorage.set('session', this.session.serialize())
        }
      }
    },
  },
})
