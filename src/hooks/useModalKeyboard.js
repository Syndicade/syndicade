import { useEffect, useRef } from 'react';

// For modals: Escape to close, Tab focus-trap, focus-return to trigger on close, autofocus first element on open
export function useModalKeyboard(isOpen, onClose, modalRef) {
  var triggerRef = useRef(null);
  var onCloseRef = useRef(onClose);

  useEffect(function () {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(function () {
    if (!isOpen) {
      return undefined;
    }

    triggerRef.current = document.activeElement;

    var focusableSelector = 'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function getFocusable() {
      if (!modalRef.current) {
        return [];
      }
      return Array.prototype.slice.call(modalRef.current.querySelectorAll(focusableSelector));
    }

    var focusable = getFocusable();
    if (focusable.length > 0) {
      focusable[0].focus();
    } else if (modalRef.current) {
      modalRef.current.focus();
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        var items = getFocusable();
        if (items.length === 0) {
          return;
        }

        var first = items[0];
        var last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return function () {
      document.removeEventListener('keydown', handleKeyDown);
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, modalRef]);
}

// For Actions dropdowns: Escape + outside-click to close, Arrow/Home/End navigation, focus-return to trigger button.
// containerRef should wrap BOTH the trigger button and the menu panel.
export function useDropdownKeyboard(isOpen, onClose, containerRef) {
  var triggerRef = useRef(null);
  var onCloseRef = useRef(onClose);

  useEffect(function () {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(function () {
    if (!isOpen) {
      return undefined;
    }

    triggerRef.current = document.activeElement;

    var itemSelector = '[role="menuitem"]';

    function getItems() {
      if (!containerRef.current) {
        return [];
      }
      return Array.prototype.slice.call(containerRef.current.querySelectorAll(itemSelector));
    }

    var items = getItems();
    if (items.length > 0) {
      items[0].focus();
    }

    function handleKeyDown(e) {
      var currentItems = getItems();
      if (currentItems.length === 0) {
        return;
      }

      var currentIndex = currentItems.indexOf(document.activeElement);

      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        var nextIndex = currentIndex < currentItems.length - 1 ? currentIndex + 1 : 0;
        currentItems[nextIndex].focus();
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        var prevIndex = currentIndex > 0 ? currentIndex - 1 : currentItems.length - 1;
        currentItems[prevIndex].focus();
        return;
      }

      if (e.key === 'Home') {
        e.preventDefault();
        currentItems[0].focus();
        return;
      }

      if (e.key === 'End') {
        e.preventDefault();
        currentItems[currentItems.length - 1].focus();
        return;
      }
    }

    function handleOutsideClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onCloseRef.current();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleOutsideClick);

    return function () {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleOutsideClick);
      if (triggerRef.current && typeof triggerRef.current.focus === 'function') {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, containerRef]);
}