// Project state Management

class ProjectState {
  private projects: any[] = [];
  private static instance: ProjectState

  private constructor(){

  }

  static getInstance() {
    if(this.instance){
      return this.instance;
    }
    this.instance = new ProjectState()
    return this.instance;
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject= {
      id: Math.random().toString(),
      title: title,
      description: description,
      people: numOfPeople
    }
    this.projects.push(newProject);
  }
}


const projectState = ProjectState.getInstance();










// bind decorator
function Bind(_:any,__:string,descriptor:PropertyDescriptor){
    
  const originalMethod = descriptor.value;
  const adjustDescriptor:PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFunction = originalMethod.bind(this);
      return boundFunction
    }
  };
  return adjustDescriptor
}


// Validation

interface Validatable {
  value: string | number
  required?: boolean;
  minLength? : number;
  maxLength? : number;
  min?: number
  max? : number
}

function validate(validatableInput:Validatable ) {
  let isValid = true;
  if(validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }
  if(validatableInput.minLength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length >= validatableInput.minLength
  }
  if(validatableInput.maxLength != null && typeof validatableInput.value === 'string') {
    isValid = isValid && validatableInput.value.length <= validatableInput.maxLength
  }
  if(validatableInput.min != null && typeof validatableInput.value === 'number'){
    isValid = isValid && validatableInput.value > validatableInput.min
  }
  if(validatableInput.max != null && typeof validatableInput.value === 'number'){
    isValid = isValid && validatableInput.value < validatableInput.max
  }
  return isValid
}

enum ProjectListType {
  ACTIVE = 'active',
  FINISHED = 'finished'
}

class ProjectList {
  templateElement: HTMLTemplateElement
  hostElement: HTMLDivElement
  element: HTMLElement
  

  constructor(private type: ProjectListType) {
    this.templateElement = document.querySelector('#project-list')!
    this.hostElement = document.querySelector('#app')!
    this.element = document.querySelector('.projects')!
    
    const importedNode = document.importNode( this.templateElement.content, true);

    this.element= importedNode.firstElementChild as HTMLElement
    this.element.id = `${this.type}-projects`
    this.attach();
    this.renderContent()
  }


  addProject() {

  }
  private attach() {
    this.hostElement.insertAdjacentElement('beforeend', this.element)
  }

  private renderContent() {
    const listId = `${this.type}-projects-list`;
    this.element.querySelector('ul')!.id = listId;
    this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + 'PROJECTS'
  }
}














class ProjectInput {
  templateElement: HTMLTemplateElement
  hostElement: HTMLDivElement
  element: HTMLFormElement
  titleInputElement: HTMLInputElement
  descriptionElement: HTMLInputElement
  peopleElement: HTMLInputElement



  constructor() {
    this.templateElement = document.getElementById('project-input')! as HTMLTemplateElement
    this.hostElement = document.getElementById('app')! as HTMLDivElement

    // importedNode는 현재 문서에 삽입할 다른 문서의 복사본을 만든다.
    // 포함하려면 현재 문서 트리에 있는 노드와 appendChild(),insertBefore()같은 삽입 메서드를 호출해야 한다.
    const importedNode = document.importNode(this.templateElement.content, true)
    this.element = importedNode.firstElementChild as HTMLFormElement

    this.titleInputElement = this.element.querySelector('#title')! as HTMLInputElement
    this.descriptionElement = this.element.querySelector('#description')! as HTMLInputElement
    this.peopleElement = this.element.querySelector('#people')! as HTMLInputElement
    this.configure()
    this.attach()
    this.gatherUSerInput()
  }

  private gatherUSerInput(): [string,string,number] | void {
    const enteredTitle = this.titleInputElement.value
    const enteredDescription = this.descriptionElement.value
    const enteredPeople = this.peopleElement.value

    const titleValidatable: Validatable = {
      value: enteredTitle,
      required: true,
      minLength: 5,
    }
    const descriptionValidatable: Validatable = {
      value: enteredDescription,
      required: true,
      minLength: 5
    }
    const peopleValidatable: Validatable = {
      value: +enteredPeople,
      required: true,
      min: 0,
      max: 5
    }
    if(
       !validate(titleValidatable)
    || !validate(descriptionValidatable)
    || !validate(peopleValidatable)){
      alert('Invalid Input')
      return
    }else{
      return [enteredTitle,enteredDescription,+enteredPeople]
    }
  }


  private clearInputs() {
    this.titleInputElement.value = '';
    this.descriptionElement.value = '';
    this.peopleElement.value = '';
  }

  @Bind
  private submitHandler(event: Event) {
    event.preventDefault();
    const userInput = this.gatherUSerInput()
    if(Array.isArray(userInput)){
      const [title,desc,people] = userInput;
      console.log(title,desc,people)
    }
    this.clearInputs()
  }

  private configure() {
    // event에서의 this는 클래스를 가리키지 않고 current Target을 가리키기 때문에 bind로 현재 method를 담고 있는 class를 가리키게 한다.
    this.element.addEventListener('submit', this.submitHandler)
  }

  private attach() {
    this.hostElement.insertAdjacentElement('afterbegin',this.element)
    this.element.id = 'user-input'
  }
}

const projectInput = new ProjectInput()
const activeProjectList = new ProjectList(ProjectListType.ACTIVE)
const finishedProjectList = new ProjectList(ProjectListType.FINISHED)
