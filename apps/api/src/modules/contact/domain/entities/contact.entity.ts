import { Entity } from '@/shared/domain';

interface ContactProps {
  workspaceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class Contact extends Entity<ContactProps> {
  get workspaceId(): string {
    return this.props.workspaceId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string | null {
    return this.props.email;
  }

  get phone(): string | null {
    return this.props.phone;
  }

  get company(): string | null {
    return this.props.company;
  }

  get notes(): string | null {
    return this.props.notes;
  }

  get tags(): string[] {
    return this.props.tags;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private constructor(props: ContactProps, id: string) {
    super(props, id);
  }

  public static create(props: ContactProps, id: string): Contact {
    return new Contact(props, id);
  }

  public updateName(name: string): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  public updateEmail(email: string | null): void {
    this.props.email = email;
    this.props.updatedAt = new Date();
  }

  public updatePhone(phone: string | null): void {
    this.props.phone = phone;
    this.props.updatedAt = new Date();
  }

  public updateCompany(company: string | null): void {
    this.props.company = company;
    this.props.updatedAt = new Date();
  }

  public updateNotes(notes: string | null): void {
    this.props.notes = notes;
    this.props.updatedAt = new Date();
  }

  public updateTags(tags: string[]): void {
    this.props.tags = tags;
    this.props.updatedAt = new Date();
  }
}
