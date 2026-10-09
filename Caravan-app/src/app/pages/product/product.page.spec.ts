import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, firstValueFrom } from 'rxjs';

export interface ProductCategory {
  category_id: number;
}

export interface Product {
  product_id: number;
  type_id?: number; // 2 = bundle
  product_name: string;
  product_image: string;
  product_price: number | string;
  product_likes: number;
  product_country?: string;
  product_desc?: string;
  product_category?: ProductCategory[];
}

interface CartItem {
  cartprod_id: number | null;
  cartbundle_id: number | null;
  cartprod_size: string;
  quantity: number;
  isBundle: boolean;
}

@Component({
  selector: 'app-product',
  standalone: false,
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
})
export class ProductPage implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  private sub?: Subscription;

  // state
  loading = false;
  loadError = '';
  isBundle = false;
  itemId = 0;

  currentItem: Product | null = null;
  basePrice = 0;
  size: '8oz' | '16oz' = '8oz';

  likeCount = 0;
  liked = false;

  similarProducts: Product[] = [];
  randomProducts: Product[] = [];

  cartBtnScale = 1;
  wishlistBusy = false;

  // modal state
  showAddToCartModal = false;
  showResultModal = false;
  showWishlistModal = false;
  showLoginModal = false;

  resultTitle = '';
  resultDesc = '';
  wishlistTitle = 'WISHLIST';
  wishlistDesc = 'Item added to wishlist.';

  ngOnInit() {
    // Subscribe so navigating between recommendations reloads the page
    this.sub = this.route.queryParamMap.subscribe((params) => {
      const bundleId = Number(params.get('bundleId'));
      const productId = Number(params.get('productId'));

      this.isBundle = !!bundleId;
      this.itemId = this.isBundle ? bundleId : productId;
      this.liked = false;
      this.size = '8oz';
      this.loadItem();
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  // ---------- Derived values ----------

  get price(): string {
    const multiplier = this.size === '8oz' ? 8 : 16;
    return (this.basePrice * multiplier).toFixed(2);
  }

  // ---------- Loading ----------

  private async loadItem() {
    this.loading = true;
    this.loadError = '';

    try {
      const [itemData, allData] = await Promise.all([
        firstValueFrom(
          this.http.get<Product | Product[]>('/api/fetchProducts', {
            params: { productId: this.itemId },
          })
        ),
        firstValueFrom(this.http.get<Product[]>('/api/fetchProducts')),
      ]);

      // Single-item endpoint returns an array
      const item = Array.isArray(itemData) ? itemData[0] : itemData;
      const products = Array.isArray(allData) ? allData : [];

      if (!item) {
        throw new Error(
          `${this.isBundle ? 'Bundle' : 'Product'} with ID ${this.itemId} was not found`
        );
      }
      if (this.isBundle && Number(item.type_id) !== 2) {
        throw new Error(`Product ID ${this.itemId} is not a bundle`);
      }

      this.currentItem = item;
      this.basePrice = Number(item.product_price) || 0;
      this.likeCount = Number(item.product_likes) || 0;

      this.similarProducts = this.shuffle(
        this.getSimilar(item, products)
      ).slice(0, 7);
      this.randomProducts = this.shuffle(
        products.filter((p) => Number(p.product_id) !== Number(item.product_id))
      ).slice(0, 7);
    } catch (error) {
      console.error('Error loading item:', error);
      this.currentItem = null;
      this.loadError = `Unable to load this ${this.isBundle ? 'bundle' : 'product'}.`;
    } finally {
      this.loading = false;
    }
  }

  private getSimilar(product: Product, products: Product[]): Product[] {
    const currentCategories = Array.isArray(product.product_category)
      ? product.product_category
      : [];

    return products.filter((other) => {
      if (Number(other.product_id) === Number(product.product_id)) return false;

      const sameCountry = other.product_country === product.product_country;
      const otherCategories = Array.isArray(other.product_category)
        ? other.product_category
        : [];
      const sameCategory = otherCategories.some((oc) =>
        currentCategories.some(
          (cc) => Number(cc.category_id) === Number(oc.category_id)
        )
      );

      return sameCountry || sameCategory;
    });
  }

  private shuffle<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // ---------- Navigation ----------

  goBack() {
    this.location.back();
  }

  openRecommendation(product: Product) {
    const key = Number(product.type_id) === 2 ? 'bundleId' : 'productId';
    this.router.navigate(['/product'], {
      queryParams: { [key]: product.product_id },
    });
  }

  goToReviews() {
    const queryParams = this.itemId
      ? { [this.isBundle ? 'bundleId' : 'productId']: this.itemId }
      : {};
    this.router.navigate(['/user/reviews'], { queryParams });
  }

  goToLogin() {
    this.showLoginModal = false;
    this.router.navigate(['/login']);
  }

  // ---------- Like ----------

  toggleLike() {
    this.liked = !this.liked;
    this.likeCount += this.liked ? 1 : -1;
    // TODO: persist like count to the database here
  }

  // ---------- Cart ----------

  async onAddToCartClick() {
    // little press animation
    this.cartBtnScale = 1.2;
    setTimeout(() => (this.cartBtnScale = 1), 200);

    try {
      const data = await firstValueFrom(
        this.http.get<{ loggedIn: boolean }>('/api/isLoggedIn')
      );
      if (!data?.loggedIn) {
        this.showLoginModal = true;
        return;
      }
      this.showAddToCartModal = true;
    } catch (error) {
      console.error('Login check failed:', error);
      this.showLoginModal = true;
    }
  }

  confirmAddToCart() {
    this.showAddToCartModal = false;

    if (!this.itemId) {
      this.openResult('CART ERROR', 'Unable to identify this item.');
      return;
    }

    const cart: CartItem[] = JSON.parse(localStorage.getItem('cart') || '[]');

    const exists = cart.some((item) =>
      this.isBundle
        ? item.isBundle === true &&
          Number(item.cartbundle_id) === this.itemId &&
          item.cartprod_size === this.size
        : item.isBundle === false &&
          Number(item.cartprod_id) === this.itemId &&
          item.cartprod_size === this.size
    );

    const itemType = this.isBundle ? 'bundle' : 'product';

    if (exists) {
      this.openResult(
        'ALREADY IN CART',
        `This ${itemType} with the selected size is already in your cart.`
      );
      return;
    }

    cart.push({
      cartprod_id: this.isBundle ? null : this.itemId,
      cartbundle_id: this.isBundle ? this.itemId : null,
      cartprod_size: this.size,
      quantity: 1,
      isBundle: this.isBundle,
    });

    localStorage.setItem('cart', JSON.stringify(cart));
    this.openResult('SUCCESS', `Your ${itemType} has been added to your cart.`);
  }

  private openResult(title: string, desc: string) {
    this.resultTitle = title;
    this.resultDesc = desc;
    this.showResultModal = true;
  }

  // ---------- Wishlist ----------

  async addToWishlist() {
    if (!this.itemId) {
      this.openWishlist('WISHLIST ERROR', 'Unable to identify this item.');
      return;
    }

    this.wishlistBusy = true;

    try {
      const result = await firstValueFrom(
        this.http.post<{ alreadyExists?: boolean; error?: string }>(
          '/api/addWishlist',
          { productId: this.itemId }
        )
      );

      if (result?.alreadyExists) {
        this.openWishlist(
          'ALREADY IN WISHLIST',
          'This item is already in your wishlist.'
        );
        return;
      }

      this.openWishlist('WISHLIST', 'Item added to wishlist.');
    } catch (err) {
      const error = err as HttpErrorResponse;

      if (error.status === 401) {
        this.showLoginModal = true;
      } else if (error.status === 409 || error.error?.alreadyExists) {
        this.openWishlist(
          'ALREADY IN WISHLIST',
          'This item is already in your wishlist.'
        );
      } else {
        console.error('Wishlist error:', error);
        this.openWishlist(
          'WISHLIST ERROR',
          error.error?.error || 'Unable to add item to wishlist.'
        );
      }
    } finally {
      this.wishlistBusy = false;
    }
  }

  private openWishlist(title: string, desc: string) {
    this.wishlistTitle = title;
    this.wishlistDesc = desc;
    this.showWishlistModal = true;
  }

  trackById(_: number, p: Product) {
    return p.product_id;
  }
}