import { async, TestBed } from '@angular/core/testing'

import { AccountProvider } from '../../providers/account/account.provider'
import { StorageMock } from '../../../test-config/storage-mock'
import { Storage } from '@ionic/storage'
import { AirGapMarketWallet } from 'airgap-coin-lib'
import { StorageProvider } from '../storage/storage'

describe('AccountProvider', () => {
  let accountProvider: AccountProvider

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [AccountProvider, StorageProvider, { provide: Storage, useClass: StorageMock }]
    })
  }))

  beforeEach(async () => {
    accountProvider = TestBed.get(AccountProvider)
    await accountProvider.walledChangedObservable.take(0).toPromise() // Wait for initial load to be over
  })

  it('should be created', () => {
    expect(accountProvider instanceof AccountProvider).toBe(true)
  })

  it('should successfully add and persist ETH wallets', async () => {
    expect(accountProvider.getWalletList().length).toEqual(1)
    await accountProvider.addWallet(
      new AirGapMarketWallet('eth', '028ac261d61169c25398de21b5e7189daa0ed040baa17922dccc58cb6564d0c996', false, `m/44'/60'/0'/0/0`)
    )
    expect(accountProvider.getWalletList().length).toEqual(2)
  })

  it('should successfully add and persist BTC wallets', async () => {
    let wallet = new AirGapMarketWallet(
      'btc',
      'xpub6EWbRuGLw9bTVVU9HE2MqT5QQ7zm9G64QgeZ5SY7qPWbciM7FyyG9BP2id1ewqZipXVWx2racXMMRvF1jB8S4syc1RzYRjnBhuq425KKYx5',
      true,
      `m/44'/0'/0'`
    )
    await accountProvider.removeWallet(wallet)
    expect(accountProvider.getWalletList().length).toEqual(0)
    await accountProvider.addWallet(wallet)
    expect(accountProvider.getWalletList().length).toEqual(1)
  })

  it('should update wallet observalbe when adding a wallet', async done => {
    let wallet = new AirGapMarketWallet(
      'btc',
      'xpub6EWbRuGLw9bTVVU9HE2MqT5QQ7zm9G64QgeZ5SY7qPWbciM7FyyG9BP2id1ewqZipXVWx2racXMMRvF1jB8S4syc1RzYRjnBhuq425KKYx5',
      true,
      `m/44'/0'/0'`
    )

    let numOfTimesCalled = 0
    accountProvider.wallets.subscribe(values => {
      numOfTimesCalled++
      if (numOfTimesCalled >= 3) {
        // Needs to be 3 times
        // 1. Initial value
        // 2. Remove wallet
        // 3. Add wallet
        done()
      }
    })

    await accountProvider.removeWallet(wallet)
    expect(accountProvider.getWalletList().length).toEqual(0)
    await accountProvider.addWallet(wallet)
    expect(accountProvider.getWalletList().length).toEqual(1)
  })
})
