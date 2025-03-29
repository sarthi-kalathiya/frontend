import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ActionMenuItem {
  id: string;
  label: string;
  icon: string;
  action: string;
  visible?: boolean;
}

@Component({
  selector: 'app-action-menu',
  templateUrl: './action-menu.component.html',
  styleUrls: ['./action-menu.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ActionMenuComponent implements OnInit, OnDestroy {
  @Input() items: ActionMenuItem[] = [];
  @Input() targetId: string = '';
  @Output() onAction = new EventEmitter<{action: string, id: string}>();
  
  isOpen: boolean = false;
  buttonPosition: { top: number, left: number } = { top: 0, left: 0 };
  flipUp: boolean = false;
  
  private documentClickListener: any;
  
  constructor(private elementRef: ElementRef) {}
  
  ngOnInit(): void {
    // Add document click listener to close menu when clicking outside
    this.documentClickListener = this.onDocumentClick.bind(this);
    document.addEventListener('click', this.documentClickListener);
  }
  
  ngOnDestroy(): void {
    // Remove event listener when component is destroyed
    document.removeEventListener('click', this.documentClickListener);
  }
  
  onDocumentClick(event: MouseEvent): void {
    // Close menu if clicking outside of the menu
    if (this.isOpen && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }
  
  toggle(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    
    if (this.isOpen) {
      this.calculatePosition(event);
    }
  }
  
  calculatePosition(event: MouseEvent): void {
    const buttonElement = event.currentTarget as HTMLElement;
    const rect = buttonElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const estimatedMenuHeight = 150; // Height estimation for the dropdown
    
    // Default position (dropdown appears below the button)
    this.buttonPosition = {
      top: rect.bottom,
      left: rect.right - 150 // Align dropdown to right edge of button, 150px width
    };
    
    this.flipUp = false;
    
    // Check if we need to flip menu up (if near the bottom of screen)
    if (rect.bottom + estimatedMenuHeight > viewportHeight) {
      this.flipUp = true;
      this.buttonPosition = {
        top: rect.top - estimatedMenuHeight,
        left: rect.right - 150
      };
    }
  }
  
  handleAction(action: string): void {
    // Emit the action and target ID
    this.onAction.emit({ action, id: this.targetId });
    this.isOpen = false;
  }
} 