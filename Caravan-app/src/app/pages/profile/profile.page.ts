import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonIcon
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import { person } from 'ionicons/icons';

type ProfileTab =
  | 'overview'
  | 'payment'
  | 'addresses'
  | 'vouchers'
  | 'wishlist'
  | 'orders'
  | 'logout';

interface Address {
  id: number;
  street: string;
  city: string;
  zipCode: string;
}

interface PaymentCard {
  id: number;
  holder: string;
  lastFour: string;
  expiry: string;
}

interface WishlistItem {
  id: number;
  name: string;
  price: string;
  image: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonIcon
  ]
})
export class ProfilePage {

  activeTab: ProfileTab = 'overview';

  customerName = 'John Doe';
  customerEmail = 'john@example.com';

  isEditingProfile = false;

  showCardModal = false;
  showAddressModal = false;
  showSaveProfileModal = false;

  showDeleteAddressModal = false;
  showLogoutModal = false;

  addressToDeleteId: number | null = null;

  editingAddressId: number | null = null;

  profile = {
    email: 'john@example.com',
    birthdate: '',
    firstName: 'John',
    lastName: 'Doe',
    password: ''
  };

  private originalProfile = { ...this.profile };

  newCard = {
    holder: '',
    number: '',
    expiry: '',
    cvv: ''
  };

  newAddress = {
    street: '',
    city: '',
    zipCode: ''
  };

  paymentCards: PaymentCard[] = [];

  addresses: Address[] = [
    {
      id: 1,
      street: '4009 Wooden Street',
      city: 'Quezon City',
      zipCode: '1803'
    },
    {
      id: 2,
      street: '67 Kiddie Avenue',
      city: 'Marikina City',
      zipCode: '1801'
    }
  ];

  wishlistItems: WishlistItem[] = [
    {
      id: 1,
      name: 'Ajwain Seeds',
      price: '2.50',
      image:
        'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=300&q=80'
    },
    {
      id: 2,
      name: 'Asafoetida',
      price: '35.00',
      image:
        'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=300&q=80'
    }
  ];

  constructor() {
    addIcons({
      person
    });
  }

  startEditProfile(): void {
    this.originalProfile = { ...this.profile };
    this.isEditingProfile = true;
  }

  saveProfile(): void {
    this.showSaveProfileModal = true;
  }

  confirmSaveProfile(): void {
    this.customerName =
      `${this.profile.firstName} ${this.profile.lastName}`.trim();

    this.customerEmail = this.profile.email;
    this.originalProfile = { ...this.profile };
    this.isEditingProfile = false;
    this.showSaveProfileModal = false;

    console.log('Profile saved:', this.profile);
  }

  cancelSaveProfile(): void {
    this.showSaveProfileModal = false;
  }

  cancelEditProfile(): void {
    this.profile = { ...this.originalProfile };
    this.isEditingProfile = false;
  }

  openCardModal(): void {
    this.resetNewCard();
    this.showCardModal = true;
  }

  closeCardModal(): void {
    this.showCardModal = false;
    this.resetNewCard();
  }

  saveCard(): void {
    const cleanedNumber = this.newCard.number.replace(/\D/g, '');

    if (
      !this.newCard.holder.trim() ||
      cleanedNumber.length < 4 ||
      !this.newCard.expiry.trim() ||
      !this.newCard.cvv.trim()
    ) {
      return;
    }

    this.paymentCards.push({
      id: Date.now(),
      holder: this.newCard.holder.trim(),
      lastFour: cleanedNumber.slice(-4),
      expiry: this.newCard.expiry.trim()
    });

    this.closeCardModal();
  }

  deleteCard(cardId: number): void {
    this.paymentCards = this.paymentCards.filter(
      card => card.id !== cardId
    );
  }

  openAddressModal(): void {
    this.editingAddressId = null;
    this.resetNewAddress();
    this.showAddressModal = true;
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
    this.editingAddressId = null;
    this.resetNewAddress();
  }

  saveAddress(): void {
    if (
      !this.newAddress.street.trim() ||
      !this.newAddress.city.trim() ||
      !this.newAddress.zipCode.trim()
    ) {
      return;
    }

    if (this.editingAddressId !== null) {
      this.addresses = this.addresses.map(address => {
        if (address.id !== this.editingAddressId) {
          return address;
        }

        return {
          ...address,
          street: this.newAddress.street.trim(),
          city: this.newAddress.city.trim(),
          zipCode: this.newAddress.zipCode.trim()
        };
      });
    } else {
      this.addresses.push({
        id: Date.now(),
        street: this.newAddress.street.trim(),
        city: this.newAddress.city.trim(),
        zipCode: this.newAddress.zipCode.trim()
      });
    }

    this.closeAddressModal();
  }

  editAddress(addressId: number): void {
    const address = this.addresses.find(
      existingAddress => existingAddress.id === addressId
    );

    if (!address) {
      return;
    }

    this.editingAddressId = address.id;

    this.newAddress = {
      street: address.street,
      city: address.city,
      zipCode: address.zipCode
    };

    this.showAddressModal = true;
  }

  deleteAddress(addressId: number): void {
    this.addressToDeleteId = addressId;
    this.showDeleteAddressModal = true;
  }

  confirmDeleteAddress(): void {

    if (this.addressToDeleteId === null) {
      return;
    }

    this.addresses = this.addresses.filter(
      address => address.id !== this.addressToDeleteId
    );

    this.addressToDeleteId = null;
    this.showDeleteAddressModal = false;
  }

  cancelDeleteAddress(): void {

    this.addressToDeleteId = null;
    this.showDeleteAddressModal = false;

  }

  viewWishlistItem(itemId: number): void {
    const selectedItem = this.wishlistItems.find(
      item => item.id === itemId
    );

    console.log('Temporary wishlist navigation:', selectedItem);
  }

  deleteWishlistItem(itemId: number): void {
    this.wishlistItems = this.wishlistItems.filter(
      item => item.id !== itemId
    );
  }

  viewOrders(): void {
    console.log('View orders clicked');
  }

  logout(): void {
    this.showLogoutModal = true;
  }

  confirmLogout(): void {
    this.showLogoutModal = false;
    console.log('User logged out');

    // later:
    // localStorage.clear();
    // this.router.navigate(['/login']);
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }


  private resetNewCard(): void {
    this.newCard = {
      holder: '',
      number: '',
      expiry: '',
      cvv: ''
    };
  }

  private resetNewAddress(): void {
    this.newAddress = {
      street: '',
      city: '',
      zipCode: ''
    };
  }
}