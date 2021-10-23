# pinia-firestore

Pinia with Firestore

pinia-firestore is a firestore helper library for pinia inspired by vuex fire.

## Sample Code

``` typescript
import { defineStore } from 'pinia'
import { doc, collection, getFirestore, query, where } from 'firebase/firestore'
import { initializeApp } from 'firebase/app'
import * as pinifire from 'pinia-firestore'

type TypeMemo = {
  memo: string
}

const app = initializeApp({
  projectId: 'agena-repo'
})

export const useMemoStore = defineStore('memo', {
  state: () => ({
    memo: { memo: "init" } as TypeMemo,
    memos: [] as TypeMemo[],
    memosIsActive: [] as TypeMemo[],
  }),

  getters: {
  },

  actions: {
    bind() {
      bind(this, 'memo', doc(getFirestore(app), "memos/000"))
      bind(this, 'memos', collection(getFirestore(app), "memos"))
      bind(this, 'memosIsActive', query(collection(getFirestore(app), "memos"), where("isActive", "==", true)))
    },
    unbind() {
      unbind(this, 'memo')
      unbind(this, 'memos')
      unbind(this, 'memosIsActive')
    }
  }
})

```

## Caution

Use v9 for firebase library.

## License

[MIT](http://opensource.org/licenses/MIT)