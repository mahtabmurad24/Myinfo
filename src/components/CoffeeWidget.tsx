import { useEffect } from 'react';

export default function CoffeeWidget() {
  useEffect(() => {
    // Check if script already exists
    if (document.querySelector('script[src*="supportkori"]')) return;

    const script = document.createElement('script');
    script.src = "https://www.supportkori.com/widget.js";
    script.setAttribute('data-id', 'mahtafgfx');
    script.setAttribute('data-message', 'Buy Me a Coffee');
    script.setAttribute('data-color', '#FFDD00');
    script.setAttribute('data-position', 'right');
    script.async = true;
    script.id = 'supportkori-widget-script';
    
    document.body.appendChild(script);

    return () => {
      // Remove the script
      const scriptToRemove = document.getElementById('supportkori-widget-script');
      if (scriptToRemove) scriptToRemove.remove();
      
      // Try to remove the widget elements
      // SupportKori usually creates a button and an iframe
      const widgetElements = document.querySelectorAll('[id*="supportkori"], [class*="supportkori"]');
      widgetElements.forEach(el => el.remove());
      
      // Also check for common widget patterns if the above doesn't work
      const iframe = document.querySelector('iframe[src*="supportkori"]');
      if (iframe) iframe.remove();
    };
  }, []);

  return null;
}
