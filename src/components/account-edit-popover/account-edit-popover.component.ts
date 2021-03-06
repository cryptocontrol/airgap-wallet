import { Component } from '@angular/core'
import { AlertController, NavParams, ViewController, ToastController, NavController } from 'ionic-angular'
import { AirGapMarketWallet } from 'airgap-coin-lib'
import { AccountProvider } from '../../providers/account/account.provider'
import { handleErrorSentry, ErrorCategory } from '../../providers/sentry-error-handler/sentry-error-handler'
import { OperationsProvider } from '../../providers/operations/operations'
import { ClipboardProvider } from '../../providers/clipboard/clipboard'

@Component({
  template: `
    <ion-list no-lines no-detail>
      <ion-list-header>{{ 'wallet-edit-popover-component.settings_label' | translate }}</ion-list-header>
      <button ion-item detail-none (click)="copyAddressToClipboard()">
        <ion-icon name="clipboard" color="dark" item-end></ion-icon>
        {{ 'wallet-edit-popover-component.copy-address_label' | translate }}
      </button>
      <button ion-item detail-none (click)="delete()">
        <ion-icon name="trash" color="dark" item-end></ion-icon>
        {{ 'wallet-edit-popover-component.delete_label' | translate }}
      </button>
    </ion-list>
  `
})
export class AccountEditPopoverComponent {
  private wallet: AirGapMarketWallet
  private onDelete: Function

  constructor(
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private walletsProvider: AccountProvider,
    private viewCtrl: ViewController,
    private clipboardProvider: ClipboardProvider,
    private operationsProvider: OperationsProvider
  ) {
    this.wallet = this.navParams.get('wallet')
    this.onDelete = this.navParams.get('onDelete')
  }

  async copyAddressToClipboard() {
    await this.clipboardProvider.copyAndShowToast(this.wallet.receivingPublicAddress)
    this.dismissPopover()
  }

  delete() {
    let alert = this.alertCtrl.create({
      title: 'Confirm Wallet Removal',
      message: 'Do you want to remove this wallet? You can always sync it again from your vault.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            this.dismissPopover()
          }
        },
        {
          text: 'Delete',
          handler: () => {
            this.walletsProvider
              .removeWallet(this.wallet)
              .then(() => {
                this.dismissPopover()
                if (this.onDelete) {
                  this.onDelete()
                }
              })
              .catch(handleErrorSentry(ErrorCategory.WALLET_PROVIDER))
          }
        }
      ]
    })
    alert.present().catch(handleErrorSentry(ErrorCategory.NAVIGATION))
  }

  dismissPopover() {
    this.viewCtrl.dismiss().catch(handleErrorSentry(ErrorCategory.NAVIGATION))
  }
}
