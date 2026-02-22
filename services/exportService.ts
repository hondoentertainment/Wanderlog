import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import { UserProfile, TravelLocation } from '../types';

export const exportService = {
    async generateTravelResume(
        profile: UserProfile,
        locations: TravelLocation[],
        elementId: string
    ): Promise<void> {
        const element = document.getElementById(elementId);
        if (!element) throw new Error('Element not found');

        try {
            const dataUrl = await toPng(element, { quality: 0.95 });
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(dataUrl);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${profile.name}_Travel_Resume.pdf`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            throw error;
        }
    }
};
