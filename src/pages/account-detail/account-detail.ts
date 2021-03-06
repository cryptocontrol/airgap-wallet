import { Component } from '@angular/core'
import { NavController, NavParams, PopoverController } from 'ionic-angular'
import { AirGapMarketWallet, ICoinSubProtocol } from 'airgap-coin-lib'
import { handleErrorSentry, ErrorCategory } from '../../providers/sentry-error-handler/sentry-error-handler'
import { AccountTransactionListPage } from '../account-transaction-list/account-transaction-list'
import { SubAccountAddPage } from '../sub-account-add/sub-account-add'
import { AccountEditPopoverComponent } from '../../components/account-edit-popover/account-edit-popover.component'
import { TransactionPreparePage } from '../transaction-prepare/transaction-prepare'
import { SubAccountSelectPage } from '../sub-account-select/sub-account-select'
import { AccountAddressPage } from '../account-address/account-address'
import { SubProtocolType } from 'airgap-coin-lib/dist/protocols/ICoinSubProtocol'
import { AccountProvider } from '../../providers/account/account.provider'
import { OperationsProvider } from '../../providers/operations/operations'
import BigNumber from 'bignumber.js'

@Component({
  selector: 'page-account-detail',
  templateUrl: 'account-detail.html'
})
export class AccountDetailPage {
  wallet: AirGapMarketWallet
  protocolIdentifier: string
  hasSubAccounts: boolean = false
  subProtocolTypes = SubProtocolType
  subProtocolTypesArray: SubProtocolType[] = Object.keys(SubProtocolType).map(key => SubProtocolType[key])
  subWalletGroups: Map<SubProtocolType, AirGapMarketWallet[]> = new Map()
  supportedSubProtocolTypes: Map<SubProtocolType, boolean> = new Map()

  public translatedLabel: string = 'account-detail.tokens_label'

  // Tezos
  public undelegatedAmount: BigNumber = new BigNumber(0)

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private popoverCtrl: PopoverController,
    private accountProvider: AccountProvider,
    private operationsProvider: OperationsProvider
  ) {
    function assertUnreachable(x: never): void {
      /* */
    }

    this.wallet = this.navParams.get('wallet')
    this.protocolIdentifier = this.wallet.coinProtocol.identifier
    this.accountProvider.subWallets.subscribe(subWallets => {
      this.hasSubAccounts = false
      const filteredSubWallets = subWallets.filter(subWallet => subWallet.publicKey === this.wallet.publicKey)
      this.subProtocolTypesArray.forEach(type => {
        const groupSubWallets = filteredSubWallets.filter(subWallet => {
          return ((subWallet.coinProtocol as any) as ICoinSubProtocol).subProtocolType === type
        })
        this.subWalletGroups.set(type, groupSubWallets)
        this.hasSubAccounts = this.hasSubAccounts || groupSubWallets.length > 0

        const subProtocolSupported = this.wallet.coinProtocol.subProtocols.some(protocol => {
          return ((protocol as any) as ICoinSubProtocol).subProtocolType === type
        })

        if (subProtocolSupported) {
          if (type === SubProtocolType.ACCOUNT) {
            this.translatedLabel = 'account-detail.accounts_label'
          } else if (type === SubProtocolType.TOKEN) {
            this.translatedLabel = 'account-detail.tokens_label'
          } else {
            assertUnreachable(type)
          }
        }
        this.supportedSubProtocolTypes.set(type, subProtocolSupported)
      })
    })
  }

  async ionViewWillEnter() {
    // Get amount of undelegated Tezos
    if (this.wallet.protocolIdentifier === 'xtz') {
      this.undelegatedAmount = new BigNumber(0)
      this.subWalletGroups.get(SubProtocolType.ACCOUNT).forEach(async wallet => {
        const delegatedResult = await this.operationsProvider.checkDelegated(wallet.receivingPublicAddress)
        if (!delegatedResult.isDelegated && delegatedResult.setable) {
          this.undelegatedAmount = this.undelegatedAmount.plus(wallet.currentBalance)
        }
      })
    }
  }

  openTransactionPage(wallet: AirGapMarketWallet) {
    this.navCtrl.push(AccountTransactionListPage, { wallet: wallet }).catch(handleErrorSentry(ErrorCategory.NAVIGATION))
  }

  openAccountAddPage(subProtocolType: SubProtocolType, wallet: AirGapMarketWallet) {
    this.navCtrl
      .push(SubAccountAddPage, { subProtocolType: subProtocolType, wallet: wallet })
      .catch(handleErrorSentry(ErrorCategory.NAVIGATION))
  }

  openPreparePage() {
    this.navCtrl
      .push(TransactionPreparePage, {
        wallet: this.wallet
      })
      .catch(handleErrorSentry(ErrorCategory.NAVIGATION))
  }

  openReceivePage() {
    this.navCtrl
      .push(AccountAddressPage, {
        wallet: this.wallet
      })
      .catch(handleErrorSentry(ErrorCategory.NAVIGATION))
  }

  presentEditPopover(event) {
    let popover = this.popoverCtrl.create(AccountEditPopoverComponent, {
      wallet: this.wallet,
      onDelete: () => {
        this.navCtrl.pop().catch(handleErrorSentry(ErrorCategory.NAVIGATION))
      }
    })
    popover
      .present({
        ev: event
      })
      .catch(handleErrorSentry(ErrorCategory.NAVIGATION))
  }

  goToDelegateSelection() {
    this.navCtrl
      .push(SubAccountSelectPage, {
        wallet: this.wallet
      })
      .catch(handleErrorSentry(ErrorCategory.NAVIGATION))
  }
}
