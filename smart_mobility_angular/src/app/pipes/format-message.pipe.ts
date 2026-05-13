import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'formatMessage'
})
export class FormatMessagePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) { }

  transform(message: string): SafeHtml {
    if (!message) return message;

    // Convertir les listes en format HTML
    let formatted = message.replace(/\n/g, '<br>');
    
    // Convertir les listes à puces (• text)
    formatted = formatted.replace(/•\s+(.+?)(?=<br>|$)/g, '<li style="margin-left: 1.5rem; margin-bottom: 0.3rem;">$1</li>');
    
    // Convertir les numéros (1️⃣, 2️⃣, etc.)
    formatted = formatted.replace(/(\d+️⃣\s+)(.+?)(?=<br>|$)/g, '<li style="margin-left: 1.5rem; margin-bottom: 0.3rem;">$1$2</li>');
    
    // Emballer les listes dans une balise ul
    formatted = formatted.replace(/(<li.+?<\/li>)/gs, (match) => {
      if (!formatted.includes('<ul>')) {
        formatted = formatted.replace(match, '<ul style="list-style: none; padding: 0; margin: 0.5rem 0;">' + match + '</ul>');
      }
      return match;
    });

    // Convertir les gras (**text**)
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong style="color: #90caf9; font-weight: 600;">$1</strong>');

    // Convertir les liens implicites [text](url)
    formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color: #00c2ff; text-decoration: none; border-bottom: 1px solid #00c2ff;">$1</a>');

    return this.sanitizer.bypassSecurityTrustHtml(formatted);
  }
}
